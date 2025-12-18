import React, { useState, useEffect } from 'react';
import { usePodcast } from '../context/PodcastContext';
import { generatePodcastScript } from '../services/geminiService';
import { InputType, Episode } from '../types';
import { useNavigate } from 'react-router-dom';

export const EpisodeCreator: React.FC = () => {
  const { programs, characters, addEpisode, updateCharacterMemory } = usePodcast();
  const navigate = useNavigate();

  const [selectedProgramId, setSelectedProgramId] = useState(programs[0].id);
  
  // State for role assignments
  const [hostId, setHostId] = useState<string | null>(null);
  const [coHostId, setCoHostId] = useState<string | null>(null);

  const [inputType, setInputType] = useState<InputType>(InputType.TOPIC);
  const [inputText, setInputText] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Auto-select host when program changes
  useEffect(() => {
    const prog = programs.find(p => p.id === selectedProgramId);
    if (prog) {
      setHostId(prog.defaultHostId || null);
      // Ensure co-host isn't the same as the new host
      if (coHostId === prog.defaultHostId) {
        setCoHostId(null);
      } else {
        setCoHostId(null); // Optional: Reset co-host or keep generic selection? Resetting is safer.
      }
    }
  }, [selectedProgramId, programs]);

  // Helper to get current program details
  const selectedProgram = programs.find(p => p.id === selectedProgramId)!;
  const hostRoleName = selectedProgram.roles.host.name;
  const coHostRoleName = selectedProgram.roles.coHost?.name || selectedProgram.roles.guest?.name || "Guest";

  const handleGenerate = async () => {
    if (!inputText || !hostId) return;
    
    setIsGenerating(true);
    setStatusMessage('Consulting character memories...');

    try {
      // Create ordered array: Host first, then Co-Host
      const selectedChars = [];
      const hostChar = characters.find(c => c.id === hostId);
      if (hostChar) selectedChars.push(hostChar);
      
      const coHostChar = characters.find(c => c.id === coHostId);
      if (coHostChar) selectedChars.push(coHostChar);

      const characterIds = selectedChars.map(c => c.id);

      // 1. Generate Script
      setStatusMessage('Gemini is writing the script...');
      const { title, summary, script } = await generatePodcastScript({
        program: selectedProgram,
        characters: selectedChars,
        topic: inputText,
        inputType,
      });

      // 2. Create Episode Object
      const newEpisode: Episode = {
        id: `ep_${Date.now()}`,
        programId: selectedProgram.id,
        title,
        summary,
        date: new Date().toISOString(),
        characters: characterIds,
        script: script, // Script lines currently have no audio
        isGenerated: true,
        coverImage: `https://picsum.photos/seed/${Date.now()}/400/300`
      };

      addEpisode(newEpisode);

      // 3. Update Memories (Async, doesn't block UI)
      selectedChars.forEach(char => {
        updateCharacterMemory(char.id, newEpisode.id, inputType === InputType.NEWS_LINK ? 'News Discussion' : inputText);
      });

      setStatusMessage('Script generated! Redirecting to player...');
      setTimeout(() => {
        navigate(`/episode/${newEpisode.id}`);
      }, 1000);

    } catch (error) {
      console.error(error);
      setStatusMessage('Error generation failed. Check API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const assignRole = (charId: string, role: 'host' | 'coHost') => {
    if (role === 'host') {
      if (hostId === charId) setHostId(null); // Toggle off
      else {
        setHostId(charId);
        if (coHostId === charId) setCoHostId(null); // Remove from other role
      }
    } else {
      if (coHostId === charId) setCoHostId(null); // Toggle off
      else {
        setCoHostId(charId);
        if (hostId === charId) setHostId(null); // Remove from other role
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-bold text-white">Create New Episode</h2>
        <p className="text-slate-400">Configure your autonomous recording session.</p>
      </div>

      <div className="space-y-8">
        {/* 1. Program Selector */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">1</div>
             <h3 className="text-lg font-medium text-white">Select Program Format</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map(prog => {
               const hostChar = characters.find(c => c.id === prog.defaultHostId);
               const isSelected = selectedProgramId === prog.id;

               return (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgramId(prog.id)}
                  className={`group relative aspect-[2/3] rounded-xl overflow-hidden text-left transition-all ${
                    isSelected
                      ? `ring-4 ring-indigo-500 scale-[1.02] shadow-2xl shadow-indigo-500/30`
                      : 'border border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100 hover:scale-[1.01]'
                  }`}
                >
                  {/* Cover Image */}
                  <div className="absolute inset-0">
                    <div className={`absolute inset-0 bg-gradient-to-t ${prog.colorClass} opacity-40 mix-blend-multiply z-10`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-20"></div>
                    <img src={prog.coverImage} alt={prog.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-30 flex flex-col justify-end h-full">
                    <div className="mb-2">
                       <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">{prog.name}</h3>
                    </div>
                    
                     {/* Moderator Mini Info */}
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-1.5 rounded-lg border border-white/5">
                      {hostChar ? (
                        <img src={hostChar.avatarUrl} className="w-6 h-6 rounded-full border border-indigo-400" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700"></div>
                      )}
                      <div className="min-w-0">
                         <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">{prog.roles.host.name}</div>
                         <div className="text-[10px] font-bold text-white truncate">{hostChar ? hostChar.name : "Unassigned"}</div>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-40 bg-indigo-500 text-white rounded-full p-1 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
               );
            })}
          </div>
        </section>

        {/* 2. Character Casting */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">2</div>
             <h3 className="text-lg font-medium text-white">Cast Roles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(char => {
              const isHost = hostId === char.id;
              const isCoHost = coHostId === char.id;
              
              return (
                <div 
                  key={char.id}
                  className={`relative bg-slate-800 rounded-xl p-4 border transition-all ${
                    isHost ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 
                    isCoHost ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 
                    'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img src={char.avatarUrl} alt={char.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-600" />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{char.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-2">{char.corePersonality}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => assignRole(char.id, 'host')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        isHost 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isHost ? '✓ ' : ''}{hostRoleName}
                    </button>
                    
                    <button
                      onClick={() => assignRole(char.id, 'coHost')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        isCoHost 
                          ? 'bg-cyan-600 border-cyan-500 text-white' 
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isCoHost ? '✓ ' : ''}{coHostRoleName}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Casting Summary */}
          <div className="mt-4 flex gap-4 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase text-xs font-bold">{hostRoleName}:</span>
              <span className={`font-medium ${hostId ? 'text-indigo-400' : 'text-slate-600 italic'}`}>
                {characters.find(c => c.id === hostId)?.name || 'Not Selected'}
              </span>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase text-xs font-bold">{coHostRoleName}:</span>
              <span className={`font-medium ${coHostId ? 'text-cyan-400' : 'text-slate-600 italic'}`}>
                {characters.find(c => c.id === coHostId)?.name || 'None'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Input Method */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">3</div>
             <h3 className="text-lg font-medium text-white">Content Source</h3>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex gap-4 mb-4 border-b border-slate-700 pb-4">
              {[InputType.TOPIC, InputType.NEWS_LINK, InputType.MANUAL].map(type => (
                <button
                  key={type}
                  onClick={() => setInputType(type)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    inputType === type ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === InputType.NEWS_LINK ? 'News Link' : type === InputType.TOPIC ? 'Topic' : 'Manual Dialogue'}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {inputType === InputType.NEWS_LINK ? 'Paste Article URL' : 'Enter Topic or Prompt'}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-32 resize-none"
                placeholder={inputType === InputType.NEWS_LINK ? "https://example.com/news/ai-takeover" : "Discuss the impact of quantum computing..."}
              />
            </div>
          </div>
        </section>

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !inputText || !hostId}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            isGenerating || !inputText || !hostId
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:from-indigo-500 hover:to-cyan-500 shadow-lg'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {statusMessage}
            </>
          ) : (
            <>
              <span>Generate Episode</span>
              <span className="text-xl">✨</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};