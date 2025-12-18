export enum MemoryDepth {
  SHALLOW = 'shallow',
  MEDIUM = 'medium',
  DEEP = 'deep',
  CUSTOM = 'custom'
}

export enum InputType {
  MANUAL = 'manual_dialogue',
  NEWS_LINK = 'news_link',
  TOPIC = 'topic'
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  password?: string; // Not used in Firebase Auth context, kept for type compatibility if needed
  isInvited?: boolean;
}

export interface Relationship {
  interactionCount: number;
  level: string;
  lastInteraction: string;
}

export interface CharacterMemory {
  totalEpisodes: number;
  relationships: Record<string, Relationship>; // Key is other characterId
  episodeHistory: EpisodeHistoryItem[];
}

export interface EpisodeHistoryItem {
  episodeId: string;
  programName: string;
  topicSummary: string;
  date: string;
}

export interface Character {
  id: string;
  name: string;
  voice: string; // Mapping to Gemini Voices: Puck, Kore, Fenrir, etc.
  avatarUrl: string;
  corePersonality: string;
  memoryDepth: MemoryDepth;
  memory: CharacterMemory;
}

export interface ProgramRole {
  name: string;
  responsibilities: string[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  format: string;
  coverImage: string; // New field
  defaultHostId?: string; // New field to link a specific character as the main host
  roles: {
    host: ProgramRole;
    coHost?: ProgramRole;
    guest?: ProgramRole;
  };
  colorClass: string;
}

export interface ScriptLine {
  id: string;
  characterId: string;
  text: string;
  audioData?: string; // Base64 Raw PCM Data (Temporary or fallback)
  audioUrl?: string; // Firebase Storage URL (Permanent)
  isAudioGenerating?: boolean;
}

export type PlatformStatus = 'draft' | 'uploaded' | 'scheduled';

export interface DistributionInfo {
  status: PlatformStatus;
  url?: string;
}

export interface EpisodeDistribution {
  spotify?: DistributionInfo;
  youtube?: DistributionInfo;
  apple?: DistributionInfo;
  instagram?: DistributionInfo;
  tiktok?: DistributionInfo;
}

export interface Episode {
  id: string;
  programId: string;
  title: string;
  date: string;
  summary: string;
  characters: string[]; // IDs
  script: ScriptLine[];
  isGenerated: boolean;
  coverImage?: string;
  distribution?: EpisodeDistribution; // New field
}

// Service Types
export interface GenerationRequest {
  program: Program;
  characters: Character[];
  topic: string;
  inputType: InputType;
  newsContent?: string;
}