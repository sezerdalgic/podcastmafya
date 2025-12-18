import React from 'react';
import { usePodcast } from '../context/PodcastContext';
import { Relationship } from '../types';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';

export const CharacterManager: React.FC = () => {
  const { characters, deleteCharacter } = usePodcast();

  const getCharacterName = (id: string) => {
    const found = characters.find(c => c.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Talent Roster</h2>
        <Link 
          to="/characters/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Add Character
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((char) => (
          <div key={char.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col h-full group relative transition-transform hover:scale-[1.01]">
            <div className="h-24 bg-gradient-to-r from-slate-700 to-slate-600 relative">
              
              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 p-1 rounded-lg backdrop-blur-sm z-20">
                <Link to={`/characters/edit/${char.id}`} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Edit">
                  <Pencil size={14} />
                </Link>
              </div>

              <Link to={`/character/${char.id}`} className="absolute -bottom-8 left-6 z-10">
                <img src={char.avatarUrl} alt={char.name} className="w-20 h-20 rounded-full border-4 border-slate-800 shadow-lg object-cover" />
              </Link>
            </div>
            
            <Link to={`/character/${char.id}`} className="pt-10 p-6 flex-1 flex flex-col hover:bg-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{char.name}</h3>
                <span className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-400 border border-slate-700">
                  {char.voice}
                </span>
              </div>
              
              <div className="text-sm text-slate-400 mb-4 line-clamp-3 italic">
                "{char.corePersonality}"
              </div>

              <div className="mt-auto space-y-3">
                <div className="bg-slate-900/50 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Memory Depth</span>
                    <span className="text-indigo-400 font-medium capitalize">{char.memoryDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience</span>
                    <span className="text-slate-200">{char.memory.totalEpisodes} Episodes</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <div className="mb-1">Top Relationships (Co-hosts):</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(char.memory.relationships).length === 0 && (
                      <span className="text-slate-600 italic">None yet</span>
                    )}
                    {Object.entries(char.memory.relationships).slice(0, 3).map(([id, rel]) => (
                      <span key={id} className="bg-slate-700 px-2 py-1 rounded text-slate-300 border border-slate-600">
                        {getCharacterName(id)}: {(rel as Relationship).interactionCount}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};