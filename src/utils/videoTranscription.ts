// Video Transcription Service using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCKfzoOyl-M_JYKr9HUib4kHuKGemUySww";
const genAI = new GoogleGenerativeAI(API_KEY);

// Use gemini-1.5-flash model for transcription and analysis
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1, // Lower temperature for more accurate transcription
    maxOutputTokens: 8192, // Allow for longer responses
    responseMimeType: "application/json" // Indicate we prefer JSON responses
  }
});

// Default timeout in milliseconds
const DEFAULT_TIMEOUT = 40000; // 40 seconds

/**
 * Creates a promise that rejects after the specified timeout
 * @param ms Timeout in milliseconds
 */
const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
};

/**
 * Transcribes video content from a base64 string
 * @param videoBase64 Base64 encoded video data
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Transcribed text
 */
export const transcribeVideo = async (videoBase64: string, timeoutMs = DEFAULT_TIMEOUT): Promise<string> => {
  const startTime = performance.now();
  try {
    // Extract the mime type and actual base64 data
    const matches = videoBase64.match(/^data:(.*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 video format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Improved prompt for better transcription
    const prompt = `
      You are a highly accurate speech-to-text transcription system.
      
      Please transcribe the speech in this video as accurately as possible, including:
      - Proper punctuation and capitalization
      - Paragraph breaks for new thoughts or topics
      - Speaker identification if multiple speakers are present
      
      Rules:
      1. Transcribe verbatim including filler words (um, uh, etc.)
      2. Include speaker emotions in [brackets] when evident (e.g., [laughs], [pauses])
      3. Mark unclear sections with [inaudible]
      4. Do not add any commentary or additional text
      5. Return only the transcribed text
    `;
    
    // Use Promise.race to implement timeout
    const transcriptionPromise = model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      }
    ]);
    
    const result = await Promise.race([
      transcriptionPromise,
      createTimeout(timeoutMs)
    ]) as any;
    
    const response = await result.response;
    const transcription = response.text().trim();
    
    const endTime = performance.now();
    console.log(`Video transcription completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return transcription;
  } catch (error: any) {
    console.error("Error transcribing video:", error);
    const endTime = performance.now();
    console.log(`Video transcription failed after ${(endTime - startTime).toFixed(2)}ms`);
    
    // Provide a fallback response in case of failure
    return "Transcription failed. Please try again with a clearer video recording.";
  }
};

/**
 * Analyzes a video interview response 
 * @param videoBase64 Base64 encoded video data
 * @param question The interview question that was asked
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Analysis of the answer including feedback, transcript, and visual assessment
 */
export const analyzeVideoResponse = async (
  videoBase64: string,
  question: string,
  timeoutMs = DEFAULT_TIMEOUT * 2 // Double timeout for analysis
): Promise<any> => {
  const startTime = performance.now();
  try {
    // First, transcribe the video
    const transcription = await transcribeVideo(videoBase64);
    
    // Fail early if transcription failed
    if (transcription.includes("Transcription failed")) {
      throw new Error("Could not transcribe video properly");
    }
    
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
    
    // Extract the mime type and actual base64 data for the analysis
    const matches = videoBase64.match(/^data:(.*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 video format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Use Promise.race to implement timeout for analysis
    const analysisPromise = model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      }
    ]);
    
    const result = await Promise.race([
      analysisPromise,
      createTimeout(timeoutMs)
    ]) as any;
    
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
      
      // Try to parse the JSON
      let analysisResult;
      try {
        analysisResult = JSON.parse(jsonText);
      } catch (syntaxError) {
        // If parsing fails, try to fix common JSON issues
        const fixedJson = jsonText
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix unquoted keys
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        analysisResult = JSON.parse(fixedJson);
      }
      
      // Add the transcript to the result object
      const endTime = performance.now();
      console.log(`Video analysis completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      return {
        ...analysisResult,
        transcript: transcription,
        processing_time_ms: Math.round(endTime - startTime)
      };
    } catch (parseError) {
      console.error("Failed to parse JSON from API response:", parseError);
      throw new Error("Invalid response format from AI model");
    }
  } catch (error: any) {
    console.error("Error analyzing video response:", error);
    const endTime = performance.now();
    console.log(`Video analysis failed after ${(endTime - startTime).toFixed(2)}ms`);
    
    // Provide a fallback response in case of failure
    return {
      score: {
        overall: 5,
        content: 5,
        delivery: 5,
        structure: 5,
        confidence: 5
      },
      strengths: [
        { category: "content", description: "Unable to fully analyze video content." }
      ],
      weaknesses: [
        { category: "technical", description: "There was an issue processing your video. Try recording in better lighting or using a better camera." }
      ],
      feedback: {
        summary: "The system encountered difficulties analyzing your video response.",
        key_points: ["Video or audio quality may have been insufficient"],
        improvement_tips: ["Try recording in a well-lit environment", "Ensure your face is clearly visible", "Check that your microphone is working properly"]
      },
      nonverbal_assessment: {
        speaking_pace: "Unable to assess",
        vocal_tone: "Unable to assess",
        pauses: "Unable to assess"
      },
      visual_assessment: {
        body_language: "Unable to assess",
        eye_contact: "Unable to assess",
        facial_expressions: "Unable to assess",
        professional_appearance: "Unable to assess"
      },
      transcript: "Transcription failed or was incomplete. Please try again with a clearer video.",
      error: error.message,
      processing_time_ms: Math.round(endTime - startTime)
    };
  }
}; 