import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePodcast } from '../context/PodcastContext';
import { GEMINI_VOICES } from '../constants';
import { MemoryDepth, Character } from '../types';
import { AlertTriangle, Trash2, Upload, RefreshCw } from 'lucide-react';

export const CharacterCreator: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addCharacter, updateCharacter, getCharacter, deleteCharacter } = usePodcast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    voice: GEMINI_VOICES[0].id,
    corePersonality: '',
    memoryDepth: MemoryDepth.MEDIUM,
    avatarType: 'seed', // 'seed' or 'custom'
    avatarValue: '123' // Seed string OR Base64 data
  });

  // Load existing character if in edit mode
  useEffect(() => {
    if (id) {
      const existing = getCharacter(id);
      if (existing) {
        // Detect if it's a generated URL or a custom base64
        const isPicsum = existing.avatarUrl.includes('picsum.photos');
        let type = 'custom';
        let val = existing.avatarUrl;

        if (isPicsum) {
          const seedMatch = existing.avatarUrl.match(/seed\/([^/]+)/);
          type = 'seed';
          val = seedMatch ? seedMatch[1] : '123';
        }

        setFormData({
          name: existing.name,
          voice: existing.voice,
          corePersonality: existing.corePersonality,
          memoryDepth: existing.memoryDepth,
          avatarType: type,
          avatarValue: val
        });
      }
    }
  }, [id, getCharacter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAvatarUrl = formData.avatarType === 'seed' 
      ? `https://picsum.photos/seed/${formData.avatarValue}/200/200`
      : formData.avatarValue;

    if (id) {
      const existing = getCharacter(id);
      if (existing) {
        const updatedCharacter: Character = {
          ...existing,
          name: formData.name,
          voice: formData.voice,
          avatarUrl: finalAvatarUrl,
          corePersonality: formData.corePersonality,
          memoryDepth: formData.memoryDepth,
        };
        updateCharacter(updatedCharacter);
      }
    } else {
      const newCharacter: Character = {
        id: formData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
        name: formData.name,
        voice: formData.voice,
        avatarUrl: finalAvatarUrl,
        corePersonality: formData.corePersonality,
        memoryDepth: formData.memoryDepth,
        memory: {
          totalEpisodes: 0,
          relationships: {},
          episodeHistory: []
        }
      };
      addCharacter(newCharacter);
    }
    
    navigate('/characters');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you absolutely sure you want to delete ${formData.name}? This cannot be undone.`)) {
       if (id) {
         deleteCharacter(id);
         navigate('/characters');
       }
    }
  };

  const randomizeAvatar = () => {
    setFormData(prev => ({ 
      ...prev, 
      avatarType: 'seed', 
      avatarValue: Math.random().toString(36).substring(7) 
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatarType: 'custom',
          avatarValue: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const currentPreviewUrl = formData.avatarType === 'seed'
    ? `https://picsum.photos/seed/${formData.avatarValue}/200/200`
    : formData.avatarValue;

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-12">
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-bold text-white">{id ? 'Edit Character' : 'Create New Character'}</h2>
        <p className="text-slate-400">Define the personality and voice of a new AI talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                placeholder="e.g. Dr. Paradox"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Voice Model</label>
              <select
                value={formData.voice}
                onChange={e => setFormData({ ...formData, voice: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              >
                {GEMINI_VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Memory Depth</label>
              <select
                value={formData.memoryDepth}
                onChange={e => setFormData({ ...formData, memoryDepth: e.target.value as MemoryDepth })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              >
                <option value={MemoryDepth.SHALLOW}>Shallow (Program Awareness Only)</option>
                <option value={MemoryDepth.MEDIUM}>Medium (Key Points & Topics)</option>
                <option value={MemoryDepth.DEEP}>Deep (Specific Phrases & Quotes)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-400 mb-4">Appearance</label>
            <div className="relative group">
              <img 
                src={currentPreviewUrl} 
                alt="Avatar Preview" 
                className="w-32 h-32 rounded-full border-4 border-indigo-500/30 shadow-xl object-cover bg-slate-900"
              />
              <div className="absolute inset-0 rounded-full ring-inset ring-1 ring-white/10"></div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={randomizeAvatar}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-md flex items-center gap-1 transition-colors"
                title="Generate Random"
              >
                <RefreshCw size={12} /> Random
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1 transition-colors"
                title="Upload Image"
              >
                <Upload size={12} /> Upload
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Core Personality & Style
            <span className="text-xs text-slate-500 ml-2 font-normal">(Crucial for AI behavior)</span>
          </label>
          <textarea
            required
            rows={4}
            value={formData.corePersonality}
            onChange={e => setFormData({ ...formData, corePersonality: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
            placeholder="Describe how they speak, their beliefs, quirks, and tempo. E.g., 'Skeptical, fast-talker, uses scientific metaphors, believes AI is dangerous.'"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/characters')}
            className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition-colors"
          >
            {id ? 'Save Changes' : 'Create Character'}
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
                     Deleting this character will remove them from the roster.
                   </p>
                   <button 
                     type="button" 
                     onClick={handleDelete}
                     className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                   >
                     <Trash2 size={16} /> Delete Character
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};