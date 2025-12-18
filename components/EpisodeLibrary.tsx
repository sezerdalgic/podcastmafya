import React from 'react';
import { usePodcast } from '../context/PodcastContext';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export const EpisodeLibrary: React.FC = () => {
  const { episodes, programs, deleteEpisode } = usePodcast();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-bold text-white">Episode Library</h2>
        <p className="text-slate-400">Archive of all generated content and broadcasts.</p>
      </div>

      {episodes.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
          <div className="text-4xl mb-4">🎙️</div>
          <h3 className="text-xl font-medium text-white mb-2">No Episodes Yet</h3>
          <p className="text-slate-400 mb-6">Create your first AI-generated podcast episode to see it here.</p>
          <Link 
            to="/create"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors"
          >
            Create Episode
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {episodes.map((ep) => {
            const program = programs.find(p => p.id === ep.programId);
            const date = new Date(ep.date).toLocaleDateString();
            
            return (
              <div key={ep.id} className="bg-slate-800 rounded-xl p-4 flex gap-6 items-center border border-slate-700 hover:border-indigo-500/50 transition-all group relative">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img 
                    src={ep.coverImage} 
                    alt={ep.title} 
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                    <span className="text-white text-2xl">▶</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${program?.colorClass || 'from-slate-600 to-slate-500'}`}>
                      {program?.name || 'Unknown Program'}
                    </span>
                    <span className="text-xs text-slate-500">{date}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white truncate mb-1">{ep.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{ep.summary}</p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                   <Link 
                    to={`/episode/${ep.id}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors text-center w-full"
                  >
                    Listen
                  </Link>
                  <button 
                    onClick={() => deleteEpisode(ep.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};