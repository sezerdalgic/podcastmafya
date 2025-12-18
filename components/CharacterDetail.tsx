import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePodcast } from '../context/PodcastContext';
import { Pencil, Mic, Layers, Clock } from 'lucide-react';

export const CharacterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { characters, episodes, programs } = usePodcast();

  const character = characters.find(c => c.id === id);

  // --- Analytics Logic ---
  const analytics = useMemo(() => {
    if (!character) return null;

    // 1. Filter Episodes where character appears
    const appearanceEpisodes = episodes.filter(ep => 
      ep.characters.includes(character.id)
    );

    // 2. Calculate Total Speaking Time (Estimate: 150 words per minute)
    let totalWords = 0;
    appearanceEpisodes.forEach(ep => {
      ep.script.forEach(line => {
        if (line.characterId === character.id) {
          totalWords += line.text.split(' ').length;
        }
      });
    });
    const totalMinutes = Math.max(1, Math.round(totalWords / 150));

    // 3. Program Diversity (Pie Chart Data)
    const programCounts: Record<string, number> = {};
    appearanceEpisodes.forEach(ep => {
      programCounts[ep.programId] = (programCounts[ep.programId] || 0) + 1;
    });

    const chartData = Object.entries(programCounts).map(([progId, count]) => {
      const prog = programs.find(p => p.id === progId);
      return {
        id: progId,
        name: prog?.name || 'Unknown',
        count,
        colorClass: prog?.colorClass || 'from-slate-500 to-slate-400',
        // Helper for SVG colors - mapping gradients to simple hex approximates for SVG
        hexColor: progId === 'yarim-hakli' ? '#f97316' : 
                  progId === 'tech-pulse' ? '#3b82f6' : '#94a3b8'
      };
    });

    const totalAppearances = appearanceEpisodes.length;

    return {
      appearanceEpisodes,
      totalMinutes,
      chartData,
      totalAppearances
    };
  }, [character, episodes, programs]);

  if (!character || !analytics) return <div className="text-white">Character not found</div>;

  // --- Pie Chart Helper ---
  // Simple SVG Donut Chart logic
  let cumulativePercent = 0;
  const pieSegments = analytics.chartData.map(data => {
    const percent = data.count / analytics.totalAppearances;
    const startX = Math.cos(2 * Math.PI * cumulativePercent);
    const startY = Math.sin(2 * Math.PI * cumulativePercent);
    cumulativePercent += percent;
    const endX = Math.cos(2 * Math.PI * cumulativePercent);
    const endY = Math.sin(2 * Math.PI * cumulativePercent);
    
    // Large arc flag
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    
    // Path command
    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`
    ].join(' ');

    return { ...data, pathData };
  });

  // Handle single item pie chart case (full circle)
  const isSingleItem = analytics.chartData.length === 1;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-start">
        <Link to="/characters" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to Roster
        </Link>
        <Link 
          to={`/characters/edit/${character.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
        >
          <Pencil size={16} /> Edit Profile
        </Link>
      </div>

      {/* Header Profile */}
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col md:flex-row gap-8 items-center">
        <img 
          src={character.avatarUrl} 
          alt={character.name} 
          className="w-32 h-32 rounded-full border-4 border-indigo-500 shadow-xl"
        />
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">{character.name}</h1>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
              Voice: {character.voice}
            </span>
          </div>
          <p className="text-slate-300 text-lg italic mb-4">"{character.corePersonality}"</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg">
                <Layers size={14} /> Memory: <span className="text-slate-200 capitalize">{character.memoryDepth}</span>
             </div>
             <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg">
                <Clock size={14} /> Created: <span className="text-slate-200">2024</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium mb-1">Total Episodes</div>
            <div className="text-4xl font-black text-white">{analytics.totalAppearances}</div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium mb-1">Minutes Spoken (Est.)</div>
            <div className="text-4xl font-black text-white">{analytics.totalMinutes}m</div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-cyan-500/10 to-transparent"></div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium mb-1">Program Reach</div>
            <div className="text-4xl font-black text-white">{analytics.chartData.length}</div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-500/10 to-transparent"></div>
        </div>
      </div>

      {/* Chart and List Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Pie Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Program Diversity</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {analytics.totalAppearances === 0 ? (
              <div className="text-slate-500 text-sm">No data available</div>
            ) : (
              <div className="relative w-48 h-48">
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full transform -rotate-90">
                  {isSingleItem ? (
                     <circle cx="0" cy="0" r="1" fill={analytics.chartData[0].hexColor} />
                  ) : (
                    pieSegments.map((seg, i) => (
                      <path 
                        key={seg.id} 
                        d={seg.pathData} 
                        fill={seg.hexColor} 
                        stroke="#1e293b" 
                        strokeWidth="0.05"
                      />
                    ))
                  )}
                </svg>
              </div>
            )}
            
            <div className="mt-6 w-full space-y-3">
              {analytics.chartData.map(d => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.hexColor }}></div>
                    <span className="text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold text-white">{Math.round((d.count / analytics.totalAppearances) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Episode List */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Episode History</h3>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {analytics.appearanceEpisodes.length === 0 ? (
               <div className="text-slate-500 text-sm italic">Has not appeared in any episodes yet.</div>
            ) : (
              analytics.appearanceEpisodes.map(ep => {
                const program = programs.find(p => p.id === ep.programId);
                return (
                  <Link 
                    key={ep.id}
                    to={`/episode/${ep.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700 border border-slate-800 hover:border-indigo-500/30 transition-all group"
                  >
                    <img src={ep.coverImage} className="w-16 h-12 object-cover rounded" alt="cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r ${program?.colorClass}`}>
                          {program?.name}
                        </span>
                        <span className="text-xs text-slate-500">• {new Date(ep.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-white font-medium truncate group-hover:text-indigo-400 transition-colors">
                        {ep.title}
                      </div>
                    </div>
                    <div className="text-slate-600 group-hover:text-indigo-400">
                      <Mic size={16} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};