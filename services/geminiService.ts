import { GoogleGenAI, Modality } from "@google/genai";
import { Character, GenerationRequest, ScriptLine, InputType } from "../types";

// ==============================================================================
// ⚠️ Gemini API Anahtarı artık .env dosyasından okunuyor.
// ==============================================================================

const getClient = () => {
  const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key Eksik! Lütfen .env dosyasını kontrol et.");
    throw new Error("API Key bulunamadı. Lütfen .env dosyasını kontrol edin.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePodcastScript = async (
  request: GenerationRequest
): Promise<{ title: string; summary: string; script: ScriptLine[] }> => {
  const client = getClient();

  // 1. Construct Character Context
  const characterProfiles = request.characters.map(c => `
    ID: ${c.id}
    NAME: ${c.name}
    VOICE: ${c.voice}
    CORE PERSONALITY: ${c.corePersonality}
    MEMORY DEPTH: ${c.memoryDepth}
    RELATIONSHIPS: ${JSON.stringify(c.memory.relationships)}
  `).join('\n---\n');

  // 2. Determine the Mode-Specific Instructions
  let taskInstructions = "";

  switch (request.inputType) {
    case InputType.MANUAL:
      taskInstructions = `
        MODE: MANUAL SCRIPT PARSING
        The user has provided a raw text script below.
        YOUR GOAL: Parse this text into the required JSON format.
        
        RULES:
        1. DO NOT generate new creative content. Stick to the user's text.
        2. Identify speaker names in the text (e.g., "Moff:", "Pico says") and map them to the closest Character ID provided above.
        3. If a line has no speaker, assign it to the character with ID: "${request.characters[0].id}" (Host).
        4. Fix minor grammar or formatting issues, but keep the meaning identical.
        5. Extract a suitable Title and Summary from the context of the dialogue.

        USER RAW INPUT:
        """
        ${request.topic}
        """
      `;
      break;

    case InputType.NEWS_LINK:
      taskInstructions = `
        MODE: NEWS ANALYSIS & DISCUSSION
        The user provided this News URL: ${request.topic}
        
        YOUR GOAL: Simulate a podcast episode discussing this specific news item.
        
        RULES:
        1. Analyze the URL text (slug) to infer the topic (e.g., if url contains 'apple-vision-pro', discuss that).
        2. Use your internal knowledge to generate a plausible, factual discussion about this likely topic.
        3. The Host should introduce the news item clearly.
        4. The Co-Host/Guest should react based on their personality (skeptical, excited, etc.).
        5. Do not hallucinate a URL if you don't know it, just discuss the topic inferred from the link string.
      `;
      break;

    case InputType.TOPIC:
    default:
      taskInstructions = `
        MODE: CREATIVE GENERATION
        Topic: ${request.topic}
        
        YOUR GOAL: Write an entertaining, original podcast script about this topic.
        
        RULES:
        1. Start with the Host's signature opening (based on Program Format).
        2. Ensure characters argue/discuss based on their defined Personalities.
        3. Include a clear conclusion.
      `;
      break;
  }

  // 3. Final System Prompt
  const prompt = `
    SYSTEM CONTEXT:
    You are the showrunner and scriptwriter for the podcast program "${request.program.name}".
    
    PROGRAM FORMAT RULES:
    ${request.program.format}
    
    AVAILABLE CHARACTERS:
    ${characterProfiles}
    
    ${taskInstructions}
    
    OUTPUT FORMAT:
    Return valid JSON ONLY. No markdown blocks.
    Structure:
    {
      "title": "Episode Title",
      "summary": "Short episode summary (max 2 sentences)",
      "lines": [
        { "characterId": "character_id_here", "text": "Spoken line here..." },
        { "characterId": "other_id", "text": "Response here..." }
      ]
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);

    if (!data.lines || !Array.isArray(data.lines)) {
      throw new Error("Invalid JSON structure received from Gemini");
    }

    const scriptWithIds: ScriptLine[] = data.lines.map((line: any, index: number) => ({
      id: `line_${Date.now()}_${index}`,
      characterId: line.characterId,
      text: line.text,
      isAudioGenerating: false
    }));

    return {
      title: data.title || "New Episode",
      summary: data.summary || "No summary available.",
      script: scriptWithIds
    };

  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

export const generateCharacterAudio = async (
  text: string,
  voiceName: string
): Promise<string> => {
  const client = getClient();

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    // Return the raw Base64 string (PCM Data)
    return base64Audio;

  } catch (error) {
    console.error("Audio generation failed:", error);
    throw error;
  }
};