import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePodcast } from '../context/PodcastContext';
import { Pencil } from 'lucide-react';

export const ProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { programs, episodes, characters } = usePodcast();

  const program = programs.find(p => p.id === id);
  
  if (!program) return <div className="text-white">Program not found</div>;

  const programEpisodes = episodes.filter(e => e.programId === program.id);
  const hostChar = characters.find(c => c.id === program.defaultHostId);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <Link to="/programs" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to Programs
        </Link>
        <Link 
          to={`/programs/edit/${program.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Pencil size={16} /> Edit Program
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl">
        <div className="absolute inset-0">
           <img src={program.coverImage} className="w-full h-full object-cover opacity-40" alt="cover" />
           <div className={`absolute inset-0 bg-gradient-to-r ${program.colorClass} mix-blend-multiply opacity-80`}></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-end">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 shadow-black drop-shadow-md">
              {program.name}
            </h1>
            <p className="text-xl text-slate-200 max-w-2xl leading-relaxed">
              {program.description}
            </p>
          </div>
          
          {hostChar && (
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-white/10 flex items-center gap-4 max-w-md">
              <img src={hostChar.avatarUrl} className="w-16 h-16 rounded-full border-2 border-indigo-500" alt={hostChar.name} />
              <div>
                 <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">{program.roles.host.name}</div>
                 <div className="text-xl font-bold text-white">{hostChar.name}</div>
                 <div className="text-xs text-slate-400 mt-1 line-clamp-1 italic">"{hostChar.corePersonality}"</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Episodes List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Latest Episodes</h2>
        
        {programEpisodes.length === 0 ? (
           <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
             <p className="text-slate-400">No episodes released for this program yet.</p>
           </div>
        ) : (
          <div className="grid gap-4">
            {programEpisodes.map(ep => (
              <Link 
                key={ep.id} 
                to={`/episode/${ep.id}`}
                className="bg-slate-800 rounded-xl p-4 flex gap-6 items-center border border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80 transition-all group"
              >
                <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={ep.coverImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="ep cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-2xl">▶</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">{new Date(ep.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{ep.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{ep.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};