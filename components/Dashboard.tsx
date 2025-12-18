import React from 'react';
import { usePodcast } from '../context/PodcastContext';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { episodes, characters, programs } = usePodcast();

  const recentEpisodes = episodes.slice(0, 3);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Network Overview</h2>
        <p className="text-slate-400">Manage your autonomous AI media empire.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Total Episodes</div>
          <div className="text-4xl font-bold text-indigo-400">{episodes.length}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Active Characters</div>
          <div className="text-4xl font-bold text-emerald-400">{characters.length}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Active Programs</div>
          <div className="text-4xl font-bold text-pink-400">{programs.length}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Recent Episodes</h3>
            <Link to="/create" className="text-sm text-indigo-400 hover:text-indigo-300">
              + Create New
            </Link>
          </div>
          <div className="space-y-3">
            {recentEpisodes.map((ep) => (
              <Link 
                key={ep.id} 
                to={`/episode/${ep.id}`}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all flex gap-4 cursor-pointer"
              >
                <img src={ep.coverImage} alt={ep.title} className="w-16 h-16 rounded object-cover bg-slate-700" />
                <div className="flex-1">
                  <h4 className="font-medium text-white">{ep.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ep.summary}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] uppercase tracking-wider bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {new Date(ep.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {recentEpisodes.length === 0 && (
              <div className="text-slate-500 text-sm italic">No episodes yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Top Characters</h3>
          <div className="space-y-3">
             {characters.slice(0, 3).map(char => (
               <Link 
                key={char.id} 
                to={`/character/${char.id}`}
                className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-lg border border-slate-700 hover:bg-slate-800 hover:border-indigo-500/50 transition-all"
               >
                 <img src={char.avatarUrl} alt={char.name} className="w-12 h-12 rounded-full border border-slate-600" />
                 <div>
                   <div className="font-medium text-white">{char.name}</div>
                   <div className="text-xs text-slate-400">
                     Voice: <span className="text-indigo-400">{char.voice}</span> • Memory: {char.memoryDepth}
                   </div>
                 </div>
                 <div className="ml-auto text-right">
                    <div className="text-lg font-bold text-slate-200">{char.memory.totalEpisodes}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Episodes</div>
                 </div>
               </Link>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};