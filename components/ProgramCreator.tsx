import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePodcast } from '../context/PodcastContext';
import { Program } from '../types';
import { AlertTriangle, Trash2, Upload, Link as LinkIcon } from 'lucide-react';

export const ProgramCreator: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addProgram, updateProgram, getProgram, deleteProgram, characters } = usePodcast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: '',
    coverImage: 'https://picsum.photos/seed/new/800/400',
    defaultHostId: '',
    hostRole: 'Host',
    coHostRole: 'Guest',
    colorTheme: 'from-purple-500 to-indigo-600'
  });

  const [useUpload, setUseUpload] = useState(false);

  const themes = [
    { name: 'Indigo', class: 'from-purple-500 to-indigo-600' },
    { name: 'Sunset', class: 'from-orange-500 to-red-600' },
    { name: 'Ocean', class: 'from-blue-500 to-cyan-600' },
    { name: 'Forest', class: 'from-emerald-500 to-green-600' },
    { name: 'Neon', class: 'from-pink-500 to-rose-500' },
  ];

  useEffect(() => {
    if (id) {
      const existing = getProgram(id);
      if (existing) {
        setFormData({
          name: existing.name,
          description: existing.description,
          format: existing.format,
          coverImage: existing.coverImage || 'https://picsum.photos/seed/new/800/400',
          defaultHostId: existing.defaultHostId || '',
          hostRole: existing.roles.host.name,
          coHostRole: existing.roles.coHost?.name || 'Guest',
          colorTheme: existing.colorClass
        });
        // If the existing image is base64, switch to upload mode conceptually, but we can just leave it
        if (existing.coverImage?.startsWith('data:')) {
            setUseUpload(true);
        }
      }
    }
  }, [id, getProgram]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (id) {
      const existing = getProgram(id);
      if (existing) {
        const updatedProgram: Program = {
          ...existing,
          name: formData.name,
          description: formData.description,
          format: formData.format,
          coverImage: formData.coverImage,
          defaultHostId: formData.defaultHostId || undefined,
          colorClass: formData.colorTheme,
          roles: {
            host: { name: formData.hostRole, responsibilities: ["Moderate", "Lead"] },
            coHost: { name: formData.coHostRole, responsibilities: ["Participate", "Provide Insight"] }
          }
        };
        updateProgram(updatedProgram);
      }
    } else {
      const newProgram: Program = {
        id: formData.name.toLowerCase().replace(/\s+/g, '-'),
        name: formData.name,
        description: formData.description,
        format: formData.format,
        coverImage: formData.coverImage,
        defaultHostId: formData.defaultHostId || undefined,
        colorClass: formData.colorTheme,
        roles: {
          host: { name: formData.hostRole, responsibilities: ["Moderate", "Lead"] },
          coHost: { name: formData.coHostRole, responsibilities: ["Participate", "Provide Insight"] }
        }
      };
      addProgram(newProgram);
    }

    navigate('/programs');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${formData.name}? This will remove the program format but keep generated episodes.`)) {
      if (id) {
        deleteProgram(id);
        navigate('/programs');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
        setUseUpload(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-12">
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-bold text-white">{id ? 'Edit Program' : 'Create New Program'}</h2>
        <p className="text-slate-400">Design the format and structure of a new show.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Program Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
            placeholder="e.g. The Night Shift"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cover Image</label>
          <div className="space-y-4">
             {/* Preview */}
             <div className="flex justify-center bg-slate-900/50 p-6 rounded-xl border border-dashed border-slate-700">
                <div className="relative aspect-[2/3] w-56 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group shadow-2xl">
                    <img src={formData.coverImage} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium">Cover Preview</span>
                    </div>
                </div>
             </div>
             
             {/* Controls */}
             <div className="flex gap-2">
               <div className="flex-1 relative">
                 <input
                   type="text"
                   disabled={useUpload}
                   value={useUpload ? '(Image Uploaded)' : formData.coverImage}
                   onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                   className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 outline-none ${useUpload ? 'text-slate-500' : ''}`}
                   placeholder="https://..."
                 />
                 <LinkIcon size={16} className="absolute left-3 top-3.5 text-slate-500" />
               </div>
               
               <button
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
               >
                 <Upload size={18} />
                 <span>Upload</span>
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleImageUpload}
               />
               
               {useUpload && (
                 <button 
                    type="button" 
                    onClick={() => {
                        setUseUpload(false);
                        setFormData(prev => ({...prev, coverImage: 'https://picsum.photos/seed/new/800/400'}));
                    }}
                    className="px-3 bg-red-900/50 text-red-400 hover:bg-red-900 rounded-lg"
                 >
                    Reset
                 </button>
               )}
             </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
            placeholder="Short tagline for the show card"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Host (Character)</label>
            <select
              value={formData.defaultHostId}
              onChange={e => setFormData({ ...formData, defaultHostId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
            >
              <option value="">-- Select a Character --</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Format Rules & Structure
            <span className="text-xs text-slate-500 ml-2 font-normal">(Instructions for the AI Scriptwriter)</span>
          </label>
          <textarea
            required
            rows={5}
            value={formData.format}
            onChange={e => setFormData({ ...formData, format: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono text-sm"
            placeholder="e.g. 1. Start with high energy intro. 2. Host asks 3 hard questions..."
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Host Role Title</label>
            <input
              type="text"
              value={formData.hostRole}
              onChange={e => setFormData({ ...formData, hostRole: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              placeholder="Moderator"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Partner Role Title</label>
            <input
              type="text"
              value={formData.coHostRole}
              onChange={e => setFormData({ ...formData, coHostRole: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              placeholder="Debater"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Visual Theme</label>
          <div className="grid grid-cols-5 gap-4">
            {themes.map(theme => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setFormData({ ...formData, colorTheme: theme.class })}
                className={`h-12 rounded-lg bg-gradient-to-r ${theme.class} transition-all ${
                  formData.colorTheme === theme.class ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title={theme.name}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/programs')}
            className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition-colors"
          >
            {id ? 'Save Changes' : 'Create Program'}
          </button>
        </div>
      </form>

      {id && (
        <div className="pt-8 border-t border-slate-800 mt-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
             <div className="flex items-start gap-4">
                <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="text-lg font-bold text-white mb-1">Danger Zone</h3>
                   <p className="text-slate-400 text-sm mb-4">
                     Deleting this program will remove it from the dashboard.
                   </p>
                   <button 
                     type="button" 
                     onClick={handleDelete}
                     className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                   >
                     <Trash2 size={16} /> Delete Program
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};