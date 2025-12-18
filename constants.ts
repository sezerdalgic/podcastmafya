import { Character, MemoryDepth, Program, Episode } from './types';

export const GEMINI_VOICES = [
  { id: 'Puck', name: 'Puck (Neutral, Clean)' },
  { id: 'Kore', name: 'Kore (Female, Calm)' },
  { id: 'Fenrir', name: 'Fenrir (Deep, Authoritative)' },
  { id: 'Charon', name: 'Charon (Deep, Narrative)' },
  { id: 'Aoede', name: 'Aoede (Female, Expressive)' }
];

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'moff',
    name: 'Moff',
    voice: 'Fenrir',
    avatarUrl: 'https://picsum.photos/seed/moff/200/200',
    corePersonality: "Energetic, skeptical, values fairness but loves a good conspiracy theory. Speaks with high energy radio-host vibes.",
    memoryDepth: MemoryDepth.DEEP,
    memory: {
      totalEpisodes: 12,
      relationships: {
        'pico': { interactionCount: 12, level: 'regular partner', lastInteraction: '2025-12-10' }
      },
      episodeHistory: []
    }
  },
  {
    id: 'pico',
    name: 'Pico',
    voice: 'Kore',
    avatarUrl: 'https://picsum.photos/seed/pico/200/200',
    corePersonality: "Analytical, optimistic about technology, calm and fact-focused. Often corrects Moff's wild theories politely.",
    memoryDepth: MemoryDepth.MEDIUM,
    memory: {
      totalEpisodes: 10,
      relationships: {
        'moff': { interactionCount: 12, level: 'regular partner', lastInteraction: '2025-12-10' }
      },
      episodeHistory: []
    }
  },
  {
    id: 'alex',
    name: 'Alex',
    voice: 'Puck',
    avatarUrl: 'https://picsum.photos/seed/alex/200/200',
    corePersonality: "Casual, witty, pop-culture obsessed. Brings complex topics down to earth with memes and metaphors.",
    memoryDepth: MemoryDepth.SHALLOW,
    memory: {
      totalEpisodes: 2,
      relationships: {},
      episodeHistory: []
    }
  }
];

export const INITIAL_PROGRAMS: Program[] = [
  {
    id: 'yarim-hakli',
    name: 'Yarım Haklı',
    description: "A debate show where two sides discuss controversial topics. Neither is fully right.",
    format: "Energetic debate. Host asks tough questions. Closing requires a call to action for voting.",
    coverImage: "https://picsum.photos/seed/yarim/800/400",
    defaultHostId: "moff",
    colorClass: "from-orange-500 to-red-600",
    roles: {
      host: { name: "Moderator", responsibilities: ["Open show", "Keep time", "Press for answers"] },
      coHost: { name: "Debater", responsibilities: ["Counter arguments", "Provide data"] }
    }
  },
  {
    id: 'tech-pulse',
    name: 'Tech Pulse',
    description: "Deep dive into emerging technology and its impact on humanity.",
    format: "Analytical, slower paced, interview style. Focus on technical details and future implications.",
    coverImage: "https://picsum.photos/seed/tech/800/400",
    defaultHostId: "pico",
    colorClass: "from-blue-500 to-cyan-600",
    roles: {
      host: { name: "Lead Analyst", responsibilities: ["Explain concepts", "Interview guest"] },
      guest: { name: "Expert", responsibilities: ["Provide deep insight", "Share experiences"] }
    }
  }
];

export const INITIAL_EPISODES: Episode[] = [
  {
    id: 'ep_demo_01',
    programId: 'yarim-hakli',
    title: 'Is AI Art Real Art?',
    date: '2025-12-14T10:00:00', // Updated to match user context
    summary: 'Moff and Pico clash over the soul of creativity in the age of generative models.',
    characters: ['moff', 'pico'],
    script: [],
    isGenerated: true,
    coverImage: 'https://picsum.photos/seed/ep1/400/300',
    distribution: {
      spotify: { status: 'draft' },
      youtube: { status: 'draft' }
    }
  }
];