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
    const prompt = `Generate 5 focused interview questions for a ${experience} ${jobRole} position that specifically tests knowledge of ${techStack}.
    
    Tailor the difficulty and depth based on the experience level:
    - Entry-level: Focus on fundamentals and basic implementation
    - Mid-level: Include system design and intermediate concepts
    - Senior: Cover architecture decisions, tradeoffs, and advanced topics
    
    Each question should be specific, challenging, and similar to what would be asked in real tech interviews.
    
    Format your response as a JSON array of objects, where each object has:
    - id: a number
    - question: the full question text (make this detailed and specific)
    - type: the question type (technical, behavioral, problem-solving, career)
    
    Include at least:
    - 2 technical questions about ${techStack}
    - 1 problem-solving scenario relevant to ${jobRole}
    - 1 behavioral question appropriate for ${experience} level
    - 1 question about career progression or role-specific expectations
    
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
    const prompt = `
      You are an expert interview coach and evaluator with years of experience helping candidates succeed in technical interviews.
      
      Analyze the following text response to this interview question:
      
      JOB ROLE: ${jobRole}
      TECH STACK: ${techStack}
      
      QUESTION: "${question}"
      
      CANDIDATE'S RESPONSE: "${answer}"
      
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
        }
      }
      
      Focus on being constructive, specific, and actionable in your feedback. Include concrete examples from the response.
      
      Return ONLY the JSON object, no additional text.
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
      
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON from API response:", parseError);
      throw new Error("Invalid response format from AI model");
    }
  } catch (error) {
    console.error("Error evaluating interview response:", error);
    
    // Provide fallback evaluation if API fails
    return {
      score: {
        overall: 7,
        content: 7,
        delivery: 7,
        structure: 7,
        confidence: 7
      },
      strengths: [
        { category: "content", description: "Attempted to answer the question completely" },
        { category: "delivery", description: "Response was clear and understandable" }
      ],
      weaknesses: [
        { category: "content", description: "Could provide more specific examples" },
        { category: "structure", description: "Answer could be more organized with a clearer structure" }
      ],
      feedback: {
        summary: "Solid answer that addresses the question but lacks detailed examples and structure.",
        key_points: ["Covers the basics of the question", "Shows understanding of core concepts"],
        improvement_tips: ["Include specific examples from your experience", "Structure your answer with a clear introduction and conclusion"]
      }
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
    // Check if any of the answers have visual assessment (from video responses)
    const hasVideoResponses = questionAnswers.some(qa => 
      qa.evaluation && qa.evaluation.visual_assessment
    );

    const prompt = `
      You are an expert interview coach with deep knowledge of ${jobRole} positions and ${techStack} technologies. You are providing final feedback to a candidate who just completed a mock interview.
      
      INTERVIEW DETAILS:
      - Job Role: ${jobRole}
      - Required Technologies: ${techStack}
      - Experience Level: ${experience}
      
      RESPONSES SUMMARY:
      ${questionAnswers.map((qa, index) => `
        QUESTION ${index + 1}: ${qa.question}
        
        ANSWER: ${qa.answer}
        
        EVALUATION:
        - Score: ${qa.evaluation?.score?.overall || qa.evaluation?.score || 'N/A'}/10
        - Content: ${qa.evaluation?.score?.content || 'N/A'}/10
        - Delivery: ${qa.evaluation?.score?.delivery || 'N/A'}/10
        - Structure: ${qa.evaluation?.score?.structure || 'N/A'}/10
        - Confidence: ${qa.evaluation?.score?.confidence || 'N/A'}/10
        
        Strengths: ${JSON.stringify(qa.evaluation?.strengths || [])}
        Weaknesses: ${JSON.stringify(qa.evaluation?.weaknesses || [])}
        
        ${qa.evaluation?.feedback?.summary || qa.evaluation?.feedback || 'No feedback available'}
        
        ${qa.evaluation?.nonverbal_assessment ? `Nonverbal Assessment: ${JSON.stringify(qa.evaluation.nonverbal_assessment)}` : ''}
        ${qa.evaluation?.visual_assessment ? `Visual Assessment: ${JSON.stringify(qa.evaluation.visual_assessment)}` : ''}
      `).join('\n\n')}
      
      Generate a detailed interview assessment report in JSON format with the following structure:
      
      {
        "overall_score": {
          "total": number from 1-10,
          "technical_knowledge": number from 1-10,
          "communication": number from 1-10,
          "problem_solving": number from 1-10,
          "culture_fit": number from 1-10
        },
        "summary": "Concise 2-3 sentence overall assessment of the candidate's performance",
        "key_strengths": [
          "Strength 1 with specific example",
          "Strength 2 with specific example",
          "Strength 3 with specific example"
        ],
        "key_weaknesses": [
          "Area for improvement 1 with specific suggestion",
          "Area for improvement 2 with specific suggestion",
          "Area for improvement 3 with specific suggestion"
        ],
        "technical_competence": "Detailed paragraph evaluating technical skills demonstrated during the interview",
        "communication_skills": "Detailed paragraph evaluating verbal communication clarity, structure, and effectiveness",
        ${hasVideoResponses ? `"visual_presentation": "Detailed paragraph evaluating body language, eye contact, and overall visual impression",` : ''}
        "question_specific_feedback": [
          {
            "question_number": 1,
            "highlights": "Key insight about their answer to this question",
            "improvement": "Specific advice for this question type"
          },
          ... (one entry per question)
        ],
        "interview_strategy_tips": [
          "Strategic tip 1 for improving interview performance",
          "Strategic tip 2 for improving interview performance",
          "Strategic tip 3 for improving interview performance"
        ],
        "preparation_recommendations": [
          "Recommendation 1 for areas to study or practice",
          "Recommendation 2 for areas to study or practice",
          "Recommendation 3 for areas to study or practice"
        ],
        "hire_recommendation": "Strong Hire | Hire | Consider with Reservations | Do Not Hire"
      }
      
      Be candid but constructive. Provide specific, actionable feedback with concrete examples from their responses. Focus on both technical and soft skills relevant to a ${jobRole} position.
      
      Return ONLY the JSON object, no additional text.
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
      
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON from API response:", parseError);
      throw new Error("Invalid response format from AI model");
    }
  } catch (error) {
    console.error("Error generating overall feedback:", error);
    throw error;
  }
};
