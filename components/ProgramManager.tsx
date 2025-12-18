import React from 'react';
import { usePodcast } from '../context/PodcastContext';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';

export const ProgramManager: React.FC = () => {
  const { programs, characters, deleteProgram } = usePodcast();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Programs</h2>
        <Link 
          to="/programs/new" 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Add Program
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {programs.map((prog) => {
          const hostChar = characters.find(c => c.id === prog.defaultHostId);

          return (
            <div key={prog.id} className="group relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-slate-800 border border-slate-700 transition-all hover:scale-[1.02] hover:shadow-indigo-500/20">
              
              {/* Admin Controls */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-lg backdrop-blur-md z-30">
                <Link to={`/programs/edit/${prog.id}`} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded transition-colors">
                  <Pencil size={14} />
                </Link>
                <button onClick={(e) => { e.preventDefault(); deleteProgram(prog.id); }} className="p-1.5 text-white/80 hover:text-red-400 hover:bg-white/20 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Main Link Wrapper */}
              <Link to={`/program/${prog.id}`} className="block h-full w-full relative">
                {/* Cover Image */}
                <div className="absolute inset-0">
                   <div className={`absolute inset-0 bg-gradient-to-t ${prog.colorClass} opacity-40 mix-blend-multiply z-10`}></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-20"></div>
                   <img src={prog.coverImage} alt={prog.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-30 flex flex-col justify-end h-full">
                  <div className="mb-4">
                     <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg mb-1">{prog.name}</h3>
                     <p className="text-xs text-slate-300 line-clamp-2 opacity-80">{prog.description}</p>
                  </div>

                  {/* Moderator Mini Badge */}
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/5">
                    {hostChar ? (
                      <img 
                        src={hostChar.avatarUrl} 
                        alt={hostChar.name} 
                        className="w-8 h-8 rounded-full border border-indigo-400" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider truncate">
                        {prog.roles.host.name}
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {hostChar ? hostChar.name : "Unassigned"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};