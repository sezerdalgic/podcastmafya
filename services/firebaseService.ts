import { db, storage } from "../firebaseConfig";
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, getDoc 
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { Character, Program, Episode, ScriptLine } from "../types";

// --- Collection References ---
const CHARS_COL = collection(db, "characters");
const PROGS_COL = collection(db, "programs");
const EPS_COL = collection(db, "episodes");

// --- DATA FETCHING ---

export const fetchAllCharacters = async (): Promise<Character[]> => {
  const snapshot = await getDocs(CHARS_COL);
  return snapshot.docs.map(doc => doc.data() as Character);
};

export const fetchAllPrograms = async (): Promise<Program[]> => {
  const snapshot = await getDocs(PROGS_COL);
  return snapshot.docs.map(doc => doc.data() as Program);
};

export const fetchAllEpisodes = async (): Promise<Episode[]> => {
  const snapshot = await getDocs(EPS_COL);
  return snapshot.docs.map(doc => doc.data() as Episode);
};

// --- CRUD OPERATIONS ---

// Generic Helper
const saveData = async (collectionName: string, id: string, data: any) => {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
};

// Characters
export const saveCharacterToDb = async (character: Character) => {
  await saveData("characters", character.id, character);
};

export const deleteCharacterFromDb = async (id: string) => {
  await deleteDoc(doc(db, "characters", id));
};

// Programs
export const saveProgramToDb = async (program: Program) => {
  await saveData("programs", program.id, program);
};

export const deleteProgramFromDb = async (id: string) => {
  await deleteDoc(doc(db, "programs", id));
};

// Episodes
export const saveEpisodeToDb = async (episode: Episode) => {
  // We save the metadata. 
  // IMPORTANT: If script is huge, Firestore documents have 1MB limit.
  // Ideally, long scripts or audio data should be separated, but for now we keep structure.
  await saveData("episodes", episode.id, episode);
};

export const deleteEpisodeFromDb = async (id: string) => {
  await deleteDoc(doc(db, "episodes", id));
};

// --- STORAGE OPERATIONS (Audio) ---

/**
 * Uploads base64 audio data to Firebase Storage and returns the public URL.
 * Used to prevent Firestore bloat and LocalStorage limits.
 */
export const uploadAudioLine = async (episodeId: string, lineId: string, base64Audio: string): Promise<string> => {
  const storageRef = ref(storage, `audio/${episodeId}/${lineId}.wav`);
  
  // Base64 string from Gemini usually comes raw, we might need to prefix it for uploadString if using 'data_url' format,
  // but 'base64' format works if raw.
  await uploadString(storageRef, base64Audio, 'base64', { contentType: 'audio/wav' });
  
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};

/**
 * Updates a specific line in an episode with the new Storage URL
 * instead of the base64 data.
 */
export const updateEpisodeScriptLineUrl = async (episode: Episode, lineId: string, url: string) => {
  const updatedScript = episode.script.map(line => 
    line.id === lineId ? { ...line, audioData: undefined, audioUrl: url, isAudioGenerating: false } : line
  );
  
  await updateDoc(doc(db, "episodes", episode.id), {
    script: updatedScript
  });
};