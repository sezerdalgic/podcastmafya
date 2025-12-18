import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePodcast } from '../context/PodcastContext';
import { generateCharacterAudio } from '../services/geminiService';
import { PlatformStatus } from '../types';
import { ExternalLink, Check, Youtube, Music, Instagram, Video, Radio } from 'lucide-react';

export const EpisodePlayer: React.FC = () => {
  const { id } = useParams();
  const { episodes, characters, programs, updateScriptLineAudio, updateEpisodeDistribution } = usePodcast();
  const episode = episodes.find(e => e.id === id);
  const program = programs.find(p => p.id === episode?.programId);

  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const isComponentMounted = useRef(true);
  
  if (!episode) return <div className="text-white">Episode not found</div>;

  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      stopAudio();
    };
  }, []);

  // --- Audio Engine ---

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Helper: Convert Raw PCM ArrayBuffer to Float32Array (AudioBuffer compatible)
  const convertPCMToFloat32 = (buffer: ArrayBuffer): Float32Array => {
    const int16Data = new Int16Array(buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }
    return float32Data;
  };

  const decodeBase64ToPCM = (base64: string): Float32Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return convertPCMToFloat32(bytes.buffer);
  };

  const playRawAudio = (pcmData: Float32Array, onEnded: () => void) => {
    try {
      initAudioContext();
      if (!audioCtxRef.current) return;

      const buffer = audioCtxRef.current.createBuffer(1, pcmData.length, 24000);
      buffer.getChannelData(0).set(pcmData);

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      
      source.onended = onEnded;

      sourceNodeRef.current = source;
      source.start(0);
    } catch (err) {
      console.error("Audio playback error:", err);
      onEnded();
    }
  };

  const playLine = async (index: number) => {
    if (!isComponentMounted.current) return;
    
    // Stop previous line if any
    stopAudio();

    if (index >= episode.script.length) {
      setIsPlaying(false);
      setCurrentLineIndex(-1);
      return;
    }

    setCurrentLineIndex(index);
    const line = episode.script[index];
    const character = characters.find(c => c.id === line.characterId);
    
    const handleNext = () => playLine(index + 1);

    // 1. Check if we have a Firebase Storage URL (Persistent)
    if (line.audioUrl) {
      try {
        // Fetch raw PCM data from Storage
        const response = await fetch(line.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pcmData = convertPCMToFloat32(arrayBuffer);
        playRawAudio(pcmData, handleNext);
      } catch (e) {
        console.error("Failed to fetch/play remote audio", e);
        handleNext();
      }
      return;
    }

    // 2. Check if we have local Base64 (Freshly generated, not saved yet)
    let audioData = line.audioData;

    // 3. Generate if missing
    if (!audioData && character) {
      try {
        audioData = await generateCharacterAudio(line.text, character.voice);
        if (isComponentMounted.current) {
          // This saves to Context -> Firebase Service -> Storage -> DB Update
          updateScriptLineAudio(episode.id, line.id, audioData);
        }
      } catch (e) {
        console.error("Failed to gen audio", e);
        setTimeout(handleNext, 1000);
        return;
      }
    }

    // Play Base64
    if (audioData) {
      const pcmData = decodeBase64ToPCM(audioData);
      playRawAudio(pcmData, handleNext);
    } else {
      // Fallback if no audio could be generated
      setTimeout(handleNext, 2000);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else {
      setIsPlaying(true);
      if (currentLineIndex === -1) {
        playLine(0);
      } else {
        // Resume from current or start over line
        playLine(currentLineIndex); 
      }
    }
  };

  // --- WAV Download Logic ---
  const downloadFullEpisode = async () => {
    if (episode.script.length === 0) return;
    setIsDownloading(true);

    try {
      const chunks: Int16Array[] = [];
      let totalLength = 0;

      for (const line of episode.script) {
        // We can only download lines that have audio
        if (!line.audioData && !line.audioUrl) continue;

        let pcmData: Int16Array | null = null;

        if (line.audioUrl) {
          try {
            const resp = await fetch(line.audioUrl);
            const buff = await resp.arrayBuffer();
            // Stored audio is 16-bit PCM (raw bytes)
            pcmData = new Int16Array(buff);
          } catch (e) {
            console.warn(`Skipping line ${line.id}: fetch failed`, e);
          }
        } else if (line.audioData) {
          // Decode Base64
          const binaryString = window.atob(line.audioData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          // Convert bytes to Int16
          pcmData = new Int16Array(bytes.buffer);
        }

        if (pcmData) {
          chunks.push(pcmData);
          totalLength += pcmData.length;
        }
      }

      if (totalLength === 0) {
        alert("No audio content available to download. Please play the episode first to generate audio.");
        setIsDownloading(false);
        return;
      }

      // Merge chunks
      const mergedSamples = new Int16Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        mergedSamples.set(chunk, offset);
        offset += chunk.length;
      }

      // Encode to WAV (24kHz, 1 channel)
      const wavBytes = encodeWAV(mergedSamples, 24000);
      
      // Trigger Download
      const blob = new Blob([wavBytes], { type: 'audio/wav' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${episode.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to export audio file.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to create WAV header + data
  const encodeWAV = (samples: Int16Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (1 is PCM) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Write samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(offset + (i * 2), samples[i], true);
    }

    return view;
  };

  useEffect(() => {
    if (currentLineIndex !== -1) {
      const el = document.getElementById(`line-${currentLineIndex}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex]);

  // --- Distribution Config ---
  const platforms = [
    { id: 'spotify', name: 'Spotify', icon: <Radio size={20} />, uploadUrl: 'https://podcasters.spotify.com/pod/dashboard/episode/create', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { id: 'youtube', name: 'YouTube', icon: <Youtube size={20} />, uploadUrl: 'https://studio.youtube.com/channel/', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { id: 'apple', name: 'Apple Music', icon: <Music size={20} />, uploadUrl: 'https://podcastsconnect.apple.com/', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram size={20} />, uploadUrl: 'https://www.instagram.com/', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
    { id: 'tiktok', name: 'TikTok', icon: <Video size={20} />, uploadUrl: 'https://www.tiktok.com/upload', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6 overflow-hidden">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-6 border-b border-slate-800 pb-6">
          <img src={episode.coverImage} className="w-32 h-32 rounded-lg object-cover shadow-2xl" alt="cover" />
          <div className="flex-1">
            <div className="flex justify-between">
               <Link to="/episodes" className="text-sm text-indigo-400 hover:underline mb-1 block">← Back to Library</Link>
               <span className="text-slate-500 text-sm">{new Date(episode.date).toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{episode.title}</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mb-4">{episode.summary}</p>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${
                   isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>Play Episode</span>
                  </>
                )}
              </button>

              <button
                onClick={downloadFullEpisode}
                disabled={isDownloading}
                className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-full text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="animate-spin">↻</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                )}
                Download Audio
              </button>
            </div>
          </div>
        </div>

        {/* Distribution Hub */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
           <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"/></svg>
             </div>
             <h2 className="text-lg font-bold text-white">Distribution Hub</h2>
             <span className="text-xs text-slate-500 ml-auto">Manage platform uploads</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
             {platforms.map(platform => {
               // @ts-ignore - dynamic key access
               const distInfo = episode.distribution?.[platform.id] || { status: 'draft', url: '' };
               const isUploaded = distInfo.status === 'uploaded';

               return (
                 <div key={platform.id} className={`rounded-lg p-4 border transition-all ${isUploaded ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800'}`}>
                    <div className="flex items-center justify-between mb-3">
                       <div className={`flex items-center gap-2 ${platform.color}`}>
                          {platform.icon}
                          <span className="font-bold text-sm text-white">{platform.name}</span>
                       </div>
                       {isUploaded && <Check size={16} className="text-emerald-500" />}
                    </div>

                    <div className="space-y-3">
                      <a 
                        href={platform.uploadUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-medium transition-colors"
                      >
                         <span>Upload</span>
                         <ExternalLink size={12} />
                      </a>

                      <div>
                        <input 
                          type="text" 
                          placeholder="Paste link..."
                          value={distInfo.url || ''}
                          onChange={(e) => updateEpisodeDistribution(episode.id, platform.id, e.target.value ? 'uploaded' : 'draft', e.target.value)}
                          className={`w-full bg-slate-900 border text-xs p-2 rounded outline-none transition-colors ${isUploaded ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-400 focus:border-indigo-500'}`}
                        />
                      </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Transcript */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
          <h3 className="text-slate-500 uppercase text-xs font-bold mb-4 sticky top-0 bg-slate-950 py-2">Transcript</h3>
          <div className="space-y-6 max-w-3xl mx-auto">
            {episode.script.map((line, index) => {
              const char = characters.find(c => c.id === line.characterId);
              const isActive = index === currentLineIndex;
              const hasAudio = line.audioData || line.audioUrl;
              
              return (
                <div 
                  key={line.id} 
                  id={`line-${index}`}
                  onClick={() => {
                    stopAudio();
                    setIsPlaying(true);
                    playLine(index);
                  }}
                  className={`flex gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                    isActive ? 'bg-indigo-900/20 border border-indigo-500/30' : 'hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 pt-1">
                     <img src={char?.avatarUrl} className="w-10 h-10 rounded-full border border-slate-700" alt={char?.name} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`font-bold text-sm ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {char?.name || 'Unknown'}
                      </span>
                      {isActive && <span className="text-[10px] text-indigo-400 font-mono animate-pulse">SPEAKING</span>}
                      {!hasAudio && <span className="text-[10px] text-slate-600 border border-slate-700 px-1 rounded">TEXT ONLY</span>}
                    </div>
                    <p className={`text-lg leading-relaxed ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {line.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};