// Audio Transcription Service using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCKfzoOyl-M_JYKr9HUib4kHuKGemUySww";
const genAI = new GoogleGenerativeAI(API_KEY);

// Use gemini-1.5-flash model for transcription and analysis
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Transcribes audio content from a base64 string
 * @param audioBase64 Base64 encoded audio data
 * @returns Transcribed text
 */
export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  try {
    // Extract the mime type and actual base64 data
    const matches = audioBase64.match(/^data:(.*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 audio format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Create an audio part for the Gemini API
    // For now, we're using a simpler approach since Gemini doesn't directly support audio transcription
    // We'll prompt the model to describe what it hears in the audio
    const prompt = "Please transcribe the following audio content as accurately as possible.";
    
    // Currently, direct audio transcription isn't fully supported in Gemini API
    // This is a simplified approach - in production, consider using a dedicated speech-to-text API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      }
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
};

/**
 * Analyzes an audio interview response 
 * @param audioBase64 Base64 encoded audio data
 * @param question The interview question that was asked
 * @returns Analysis of the answer including feedback and transcript
 */
export const analyzeAudioResponse = async (
  audioBase64: string,
  question: string
): Promise<any> => {
  try {
    // First, transcribe the audio
    const transcription = await transcribeAudio(audioBase64);
    
    // Then analyze the transcribed response in relation to the question
    const prompt = `
      You are an expert interview evaluator. Analyze the following response to an interview question:
      
      Question: ${question}
      
      Candidate's Response (transcribed from audio): ${transcription}
      
      Provide your evaluation as a JSON object with the following properties:
      - score: a number from 1 to 10 rating the answer
      - strengths: an array of strengths in the answer (maximum 3)
      - weaknesses: an array of areas for improvement (maximum 3)
      - feedback: a brief constructive paragraph of feedback
      - nonverbal_assessment: analysis of speaking pace, tone, and vocal clarity based on the transcription
      
      Only respond with the JSON, no additional text.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Extract the JSON portion if there are any markdown code blocks
      let jsonText = text;
      if (text.includes("```json")) {
        jsonText = text.split("```json")[1].split("```")[0].trim();
      } else if (text.includes("```")) {
        jsonText = text.split("```")[1].split("```")[0].trim();
      }
      
      // Parse the JSON and add the transcript
      const analysisResult = JSON.parse(jsonText);
      
      // Add the transcript to the result object
      return {
        ...analysisResult,
        transcript: transcription
      };
    } catch (parseError) {
      console.error("Failed to parse JSON from API response:", parseError);
      throw new Error("Invalid response format from AI model");
    }
  } catch (error) {
    console.error("Error analyzing audio response:", error);
    throw error;
  }
}; 