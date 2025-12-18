import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Character, Program, Episode, PlatformStatus } from '../types';
import { INITIAL_CHARACTERS, INITIAL_PROGRAMS, INITIAL_EPISODES } from '../constants';
import * as dbService from '../services/firebaseService';

interface PodcastContextType {
  characters: Character[];
  programs: Program[];
  episodes: Episode[];
  addEpisode: (episode: Episode) => void;
  deleteEpisode: (id: string) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (character: Character) => void;
  deleteCharacter: (id: string) => void;
  getCharacter: (id: string) => Character | undefined;
  addProgram: (program: Program) => void;
  updateProgram: (program: Program) => void;
  deleteProgram: (id: string) => void;
  getProgram: (id: string) => Program | undefined;
  updateCharacterMemory: (characterId: string, episodeId: string, topic: string) => void;
  updateScriptLineAudio: (episodeId: string, lineId: string, audioData: string) => Promise<void>;
  updateEpisodeDistribution: (episodeId: string, platform: string, status: PlatformStatus, url?: string) => void;
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

export const PodcastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Initial Load from Firebase
  useEffect(() => {
    const initData = async () => {
      try {
        const dbChars = await dbService.fetchAllCharacters();
        const dbProgs = await dbService.fetchAllPrograms();
        const dbEps = await dbService.fetchAllEpisodes();

        // Seed if empty (First run)
        if (dbChars.length === 0 && dbProgs.length === 0) {
          console.log("Database empty. Seeding initial data...");
          // Seed Characters
          for (const c of INITIAL_CHARACTERS) await dbService.saveCharacterToDb(c);
          setCharacters(INITIAL_CHARACTERS);
          
          // Seed Programs
          for (const p of INITIAL_PROGRAMS) await dbService.saveProgramToDb(p);
          setPrograms(INITIAL_PROGRAMS);
          
          // Seed Episodes
          for (const e of INITIAL_EPISODES) await dbService.saveEpisodeToDb(e);
          setEpisodes(INITIAL_EPISODES);
        } else {
          setCharacters(dbChars);
          setPrograms(dbProgs);
          // Sort episodes by date desc
          setEpisodes(dbEps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (e) {
        console.error("Failed to load data from Firebase", e);
      }
    };

    initData();
  }, []);

  // --- ACTIONS (Optimistic UI + DB Sync) ---

  const addEpisode = (episode: Episode) => {
    setEpisodes(prev => [episode, ...prev]);
    dbService.saveEpisodeToDb(episode);
  };

  const deleteEpisode = (id: string) => {
    if (window.confirm('Are you sure you want to delete this episode?')) {
      setEpisodes(prev => prev.filter(e => e.id !== id));
      dbService.deleteEpisodeFromDb(id);
    }
  };

  const addCharacter = (character: Character) => {
    setCharacters(prev => [...prev, character]);
    dbService.saveCharacterToDb(character);
  };

  const updateCharacter = (character: Character) => {
    setCharacters(prev => prev.map(c => c.id === character.id ? character : c));
    dbService.saveCharacterToDb(character);
  };

  const deleteCharacter = (id: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      dbService.deleteCharacterFromDb(id);
    }
  };

  const getCharacter = (id: string) => characters.find(c => c.id === id);

  const addProgram = (program: Program) => {
    setPrograms(prev => [...prev, program]);
    dbService.saveProgramToDb(program);
  };

  const updateProgram = (program: Program) => {
    setPrograms(prev => prev.map(p => p.id === program.id ? program : p));
    dbService.saveProgramToDb(program);
  };

  const deleteProgram = (id: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      setPrograms(prev => prev.filter(p => p.id !== id));
      dbService.deleteProgramFromDb(id);
    }
  };

  const getProgram = (id: string) => programs.find(p => p.id === id);

  const updateCharacterMemory = (characterId: string, episodeId: string, topic: string) => {
    setCharacters(prev => {
      const updatedChars = prev.map(char => {
        if (char.id !== characterId) return char;
        
        const today = new Date();
        const localDate = today.toLocaleDateString('en-CA');

        const newHistoryItem = {
          episodeId,
          programName: "Unknown", 
          topicSummary: topic,
          date: localDate
        };

        const updatedChar = {
          ...char,
          memory: {
            ...char.memory,
            totalEpisodes: char.memory.totalEpisodes + 1,
            episodeHistory: [newHistoryItem, ...char.memory.episodeHistory]
          }
        };
        
        // Sync to DB immediately
        dbService.saveCharacterToDb(updatedChar);
        return updatedChar;
      });
      return updatedChars;
    });
  };

  const updateScriptLineAudio = async (episodeId: string, lineId: string, audioData: string) => {
    // 1. Optimistic Update (Show playable immediately via base64)
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== episodeId) return ep;
      return {
        ...ep,
        script: ep.script.map(line => {
          if (line.id !== lineId) return line;
          return { ...line, audioData, isAudioGenerating: false };
        })
      };
    }));

    // 2. Background Upload to Firebase Storage
    try {
      const audioUrl = await dbService.uploadAudioLine(episodeId, lineId, audioData);
      
      // 3. Update DB with URL instead of Base64
      const currentEpisode = episodes.find(e => e.id === episodeId);
      if (currentEpisode) {
        // We need to update state again to clear base64 and set URL? 
        // Or just update DB. Let's update DB.
        await dbService.updateEpisodeScriptLineUrl(currentEpisode, lineId, audioUrl);
      }
    } catch (e) {
      console.error("Failed to upload audio to storage", e);
    }
  };

  const updateEpisodeDistribution = (episodeId: string, platform: string, status: PlatformStatus, url?: string) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== episodeId) return ep;
      const updatedEp = {
        ...ep,
        distribution: {
          ...ep.distribution,
          [platform]: { status, url }
        }
      };
      // Sync DB
      dbService.saveEpisodeToDb(updatedEp);
      return updatedEp;
    }));
  };

  return (
    <PodcastContext.Provider value={{ 
      characters, programs, episodes, 
      addEpisode, deleteEpisode,
      addCharacter, updateCharacter, deleteCharacter, getCharacter,
      addProgram, updateProgram, deleteProgram, getProgram,
      updateCharacterMemory, updateScriptLineAudio, updateEpisodeDistribution
    }}>
      {children}
    </PodcastContext.Provider>
  );
};

export const usePodcast = () => {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error("usePodcast must be used within an AuthProvider");
  }
  return context;
};