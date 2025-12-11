import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateRepertoireTips = async (title: string, composer: string, instrument: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide 3 short, practical performance tips for a ${instrument} player performing "${title}" by ${composer} in a brass band setting. Keep it under 50 words per tip.`,
    });
    return response.text || "No tips generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate tips at this time.";
  }
};
