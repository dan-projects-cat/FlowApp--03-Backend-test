
import { GoogleGenAI } from "@google/genai";

// IMPORTANT: The API key must be available as an environment variable `process.env.API_KEY`
// Do not add any UI or code to handle the API key.
// It is assumed to be configured externally.
let ai: GoogleGenAI | null = null;
try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch(e) {
    console.error("Failed to initialize GoogleGenAI. Is API_KEY set?", e);
}


export const generateDescription = async (itemName: string, ingredients: string[]): Promise<string> => {
  if (!ai) {
    return Promise.resolve("AI service is not available. Please check your API key configuration.");
  }
  
  const model = 'gemini-2.5-flash';
  const prompt = `Write a short, appetizing menu description for "${itemName}" with ingredients: ${ingredients.join(', ')}.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt
    });
    
    if (response.text) {
        return response.text.trim();
    } else {
        return "Could not generate a description at this time.";
    }
  } catch (error) {
    console.error("Error generating description:", error);
    return "An error occurred while generating the description.";
  }
};