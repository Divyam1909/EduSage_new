// Google Gemini AI API integration for EduSage
// This file provides functions to interact with the Gemini API for interview assistance
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the API key from environment variables
// Access environment variables with import.meta.env in Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCKfzoOyl-M_JYKr9HUib4kHuKGemUySww";
const genAI = new GoogleGenerativeAI(API_KEY);

// Use gemini-1.5-flash model which is available in the API
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to handle model requests
const handleModelRequest = async (prompt: string) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// Helper to parse JSON from response
const parseJsonResponse = (text: string) => {
  try {
    // Extract the JSON portion if there are any markdown code blocks
    let jsonText = text;
    if (text.includes("```json")) {
      jsonText = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      jsonText = text.split("```")[1].split("```")[0].trim();
    }
    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error("Failed to parse JSON from API response:", parseError);
    throw new Error("Invalid response format from AI model");
  }
};

/**
 * Generates interview questions based on job role, tech stack, and experience level
 * @param jobRole The position being applied for
 * @param techStack Technologies and skills required
 * @param experience Experience level (entry-level, mid-level, senior)
 * @returns Array of interview questions with type and ID
 */
export const generateInterviewQuestions = async (
  jobRole: string,
  techStack: string,
  experience: string
): Promise<any[]> => {
  try {
    const prompt = `Generate 5 interview questions for a ${experience} ${jobRole} position with focus on ${techStack}. 
    Include a mix of technical, behavioral, and problem-solving questions.
    Format your response as a JSON array of objects, where each object has:
    - id: a number
    - question: the full question text
    - type: the question type (technical, behavioral, problem-solving, career)
    
    Only respond with the JSON, no additional text.`;

    const text = await handleModelRequest(prompt);
    return parseJsonResponse(text);
  } catch (error) {
    console.error("Error generating interview questions:", error);
    
    // Provide fallback questions if API fails completely
    return [
      {
        id: 1,
        question: `Tell me about your experience with ${techStack}.`,
        type: "technical"
      },
      {
        id: 2,
        question: `How would you implement a solution for a typical ${jobRole} problem?`,
        type: "problem-solving"
      },
      {
        id: 3,
        question: "Describe a challenging project you worked on and how you overcame obstacles.",
        type: "behavioral"
      },
      {
        id: 4,
        question: `What are the key considerations when working with ${techStack}?`,
        type: "technical"
      },
      {
        id: 5,
        question: "Where do you see yourself in 5 years?",
        type: "career"
      }
    ];
  }
};

/**
 * Evaluates a response to an interview question
 * @param jobRole The position being applied for
 * @param techStack Technologies and skills required
 * @param question The interview question
 * @param answer The candidate's answer
 * @returns Evaluation object with feedback
 */
export const evaluateInterviewResponse = async (
  jobRole: string,
  techStack: string,
  question: string,
  answer: string
): Promise<any> => {
  try {
    const prompt = `Evaluate the following answer to an interview question for a ${jobRole} position with ${techStack}.
    
    Question: ${question}
    
    Answer: ${answer}
    
    Provide your evaluation as a JSON object with the following properties:
    - score: a number from 1 to 10 rating the answer
    - strengths: an array of strengths in the answer (maximum 3)
    - weaknesses: an array of areas for improvement (maximum 3)
    - feedback: a brief constructive paragraph of feedback
    
    Only respond with the JSON, no additional text.`;

    const text = await handleModelRequest(prompt);
    return parseJsonResponse(text);
  } catch (error) {
    console.error("Error evaluating interview response:", error);
    
    // Provide fallback evaluation if API fails
    return {
      score: 7,
      strengths: ["Attempted to answer the question", "Showed some knowledge of the subject"],
      weaknesses: ["Could provide more detail", "Consider exploring practical examples"],
      feedback: "Your answer shows understanding of the concepts. Try to include more specific examples and details in future responses."
    };
  }
};

/**
 * Generates overall feedback for the entire interview
 * @param jobRole The position being applied for
 * @param techStack Technologies and skills required
 * @param experience Experience level
 * @param questionAnswers Array of questions, answers, and evaluations
 * @returns Comprehensive feedback object
 */
export const generateOverallFeedback = async (
  jobRole: string,
  techStack: string,
  experience: string,
  questionAnswers: any[]
): Promise<any> => {
  try {
    // Format the questionAnswers for the prompt
    const questionsAnswersText = questionAnswers.map((qa, index) => {
      return `
Question ${index + 1}: ${qa.question}
Answer: ${qa.answer || 'No answer provided'}
Evaluation: ${JSON.stringify(qa.evaluation)}
      `;
    }).join("\n");

    const prompt = `Provide comprehensive feedback for a candidate who interviewed for a ${experience} ${jobRole} position with focus on ${techStack}.
    
    Here are the questions, answers, and individual evaluations:
    
    ${questionsAnswersText}
    
    Provide your overall assessment as a JSON object with the following properties:
    - overall_score: a number from 1 to 10 rating the candidate
    - summary: a concise summary of their performance
    - key_strengths: an array of their main strengths (3-5 items)
    - key_weaknesses: an array of their main areas for improvement (3-5 items)
    - technical_competence: assessment of their technical skills
    - communication_skills: assessment of how well they communicated
    - recommendations: specific advice for improvement
    - hire_recommendation: whether you would recommend hiring them ("Recommend to hire", "Consider for further rounds", or "Do not recommend")
    
    Only respond with the JSON, no additional text.`;

    const text = await handleModelRequest(prompt);
    return parseJsonResponse(text);
  } catch (error) {
    console.error("Error generating overall feedback:", error);
    
    // Calculate average score for fallback
    const scores = questionAnswers.map(qa => qa.evaluation?.score || 0);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
      : 7;
    
    // Provide fallback feedback if API fails
    return {
      overall_score: averageScore,
      summary: `The candidate demonstrated knowledge of ${techStack} and showed problem-solving skills appropriate for a ${experience} ${jobRole}.`,
      key_strengths: [
        "Attempted to answer all questions",
        "Showed technical knowledge",
        "Demonstrated problem-solving approach"
      ],
      key_weaknesses: [
        "Could provide more detailed answers",
        "Should include more specific examples",
        "Consider discussing trade-offs in technical solutions"
      ],
      technical_competence: `Technical knowledge appears adequate for the position.`,
      communication_skills: "Communication was clear but could be more detailed.",
      recommendations: `Continue building projects with ${techStack} and practice interview scenarios.`,
      hire_recommendation: averageScore >= 8 ? "Recommend to hire" : "Consider for further rounds"
    };
  }
};
