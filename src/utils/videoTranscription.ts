// Video Transcription Service using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCKfzoOyl-M_JYKr9HUib4kHuKGemUySww";
const genAI = new GoogleGenerativeAI(API_KEY);

// Use gemini-1.5-flash model for transcription and analysis
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Transcribes video content from a base64 string
 * @param videoBase64 Base64 encoded video data
 * @returns Transcribed text
 */
export const transcribeVideo = async (videoBase64: string): Promise<string> => {
  try {
    // Extract the mime type and actual base64 data
    const matches = videoBase64.match(/^data:(.*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 video format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Create a video part for the Gemini API
    const prompt = "Please transcribe the speech in this video as accurately as possible.";
    
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
    console.error("Error transcribing video:", error);
    throw error;
  }
};

/**
 * Analyzes a video interview response 
 * @param videoBase64 Base64 encoded video data
 * @param question The interview question that was asked
 * @returns Analysis of the answer including feedback, transcript, and visual assessment
 */
export const analyzeVideoResponse = async (
  videoBase64: string,
  question: string
): Promise<any> => {
  try {
    // First, transcribe the video
    const transcription = await transcribeVideo(videoBase64);
    
    // Then analyze the transcribed response and video content in relation to the question
    const prompt = `
      You are an expert interview coach and evaluator with years of experience helping candidates succeed in technical interviews.
      
      Analyze the following video response to this interview question:
      
      QUESTION: "${question}"
      
      CANDIDATE'S RESPONSE (transcribed from video): "${transcription}"
      
      Provide a comprehensive evaluation in JSON format with the following structure:
      
      {
        "score": {
          "overall": number from 1-10,
          "content": number from 1-10,
          "delivery": number from 1-10,
          "structure": number from 1-10,
          "confidence": number from 1-10
        },
        "strengths": [
          { "category": "content|delivery|structure", "description": "Specific strength with example from response" },
          ... (up to 3 total)
        ],
        "weaknesses": [
          { "category": "content|delivery|structure", "description": "Specific weakness with suggestion for improvement" },
          ... (up to 3 total)
        ],
        "feedback": {
          "summary": "1-2 sentence overall assessment",
          "key_points": ["Bullet point observations", ...],
          "improvement_tips": ["Actionable advice", ...]
        },
        "nonverbal_assessment": {
          "speaking_pace": "Assessment of speaking speed and rhythm",
          "vocal_tone": "Assessment of voice modulation and clarity",
          "pauses": "Assessment of effective use of pauses and fillers"
        },
        "visual_assessment": {
          "body_language": "Assessment of posture and physical presence",
          "eye_contact": "Assessment of eye contact and camera engagement",
          "facial_expressions": "Assessment of appropriate expressions",
          "professional_appearance": "Assessment of overall professional presentation"
        },
        "transcript": "The raw transcript (automatically filled - leave empty)"
      }
      
      Focus on being constructive, specific, and actionable in your feedback. Include concrete examples from the response. Be detailed but concise.
      
      Return ONLY the JSON object, no additional text.
    `;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: videoBase64.split(';')[0].split(':')[1],
          data: videoBase64.split(',')[1]
        }
      }
    ]);
    
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
    console.error("Error analyzing video response:", error);
    throw error;
  }
}; 