
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

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data url prefix (e.g. "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const validateProfilePicture = async (file: File): Promise<{ isValid: boolean; reason?: string }> => {
  if (!ai) {
    // If no API key, bypass check to avoid blocking the app in dev/demo mode without keys
    console.warn("BandSocial: Skipping AI Image Validation (No API Key).");
    return { isValid: true };
  }

  try {
    const base64Data = await fileToBase64(file);
    
    const prompt = `
      Analyze this image for a user profile picture registration.
      Strictly check for these conditions:
      1. Does the image contain a clearly visible real human face? (No cartoons, no objects, no animals, no group photos where the user is unclear).
      2. Is the face sharp and not blurry?
      3. Is the image natural and authentic? REJECT if it appears to be AI-generated, a deepfake, or heavily altered by AI filters/FaceApp.

      Return a JSON object with this structure:
      {
        "isValid": boolean,
        "reason": "string (in Portuguese, short explanation if invalid, e.g., 'Parece imagem gerada por IA', 'Foto muito borrada' or 'Rosto não detectado')"
      }
      Do not include markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text.trim());
    return result;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    // Fallback: If AI fails, allow the image to prevent blocking registration due to API errors
    return { isValid: true }; 
  }
};
