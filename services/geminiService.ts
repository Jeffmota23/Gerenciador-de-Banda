import { GoogleGenAI } from "@google/genai";

// Helper to safely get env var without crashing in browser
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore reference errors
  }
  return '';
};

const apiKey = getApiKey();
let ai: GoogleGenAI | null = null;

// Initialize lazily/safely to prevent white-screen crash on module load
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("BandSocial: Failed to initialize Gemini API client", error);
  }
}

export const generateRepertoireTips = async (title: string, composer: string, instrument: string): Promise<string> => {
  if (!ai) {
    console.warn("BandSocial: AI features disabled. API Key missing or invalid.");
    return "Dicas de IA indisponíveis (Chave API não configurada).";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide 3 short, practical performance tips for a ${instrument} player performing "${title}" by ${composer} in a brass band setting. Keep it under 50 words per tip.`,
    });
    return response.text || "Sem dicas geradas.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Não foi possível gerar dicas no momento.";
  }
};