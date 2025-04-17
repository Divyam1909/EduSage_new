const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize the Gemini API with the API key from environment variables
const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Helper function to convert different date formats to ISO "YYYY-MM-DD" format
 * Handles various formats including date ranges like "04-10 January 2025"
 */
function parseDateStr(dateStr) {
  console.log("Parsing date string:", dateStr);
  
  // Clean up and split the date string into parts
  dateStr = dateStr.trim();
  const parts = dateStr.split(" ").filter(p => p);
  
  // Ensure we have enough parts to form a complete date
  if (parts.length < 3) {
    console.log("Not enough parts in date string");
    return null;
  }
  
  let day, monthName, year;
  
  // Handle date ranges like "04-10 January 2025"
  if (parts[0].includes("-")) {
    // Take the first day in the range
    day = parts[0].split("-")[0].trim();
    monthName = parts[1];
    year = parts[2];
  } else {
    day = parts[0];
    monthName = parts[1];
    year = parts[2];
  }
  
  // Ensure day has leading zero if needed
  if (day.length === 1) day = "0" + day;
  
  // Convert month name to number
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  
  const monthIndex = monthNames.indexOf(monthName.toLowerCase());
  if (monthIndex === -1) {
    console.log("Invalid month name:", monthName);
    return null;
  }
  
  // Format the date as YYYY-MM-DD
  const monthNum = (monthIndex + 1).toString().padStart(2, "0");
  const formattedDate = `${year}-${monthNum}-${day}`;
  console.log("Formatted date:", formattedDate);
  return formattedDate;
}

/**
 * Helper to parse JSON from Gemini API response
 */
function parseJsonResponse(text) {
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
}

/**
 * Process PDF text with Gemini AI to extract events
 */
async function processTextWithGemini(pdfText) {
  try {
    const prompt = `
    You are an academic calendar parsing expert specializing in extracting structured event data from PDF documents.
    
    Here is the content from an academic calendar PDF (may be incomplete or have formatting issues):
    
    ${pdfText.substring(0, 35000)} 
    
    I need you to carefully extract ALL academic events from this text, with special attention to:
    
    1. Ensuring no events are missed (completeness is critical)
    2. Keeping titles concise but descriptive
    3. Capturing all relevant information in the details field
    
    For each event, extract:
    1. TITLE: A short, clear title (MAX 25 CHARACTERS) that identifies the event type
    2. DATE: The event date in YYYY-MM-DD format
    3. DETAILS: All additional information about the event including full descriptions, locations, etc.
    
    Focus on academic calendar events such as:
    - Registration periods
    - Exams/assessments/tests
    - Semester start/end dates
    - Holidays/breaks/vacations
    - Special lectures/workshops/seminars
    - Submission deadlines
    - Orientation days
    - Results announcements
    - Admission processes
    - Faculty meetings
    - Cultural/technical events
    
    IMPORTANT FORMATTING REQUIREMENTS:
    - Titles MUST be very short (maximum 25 characters) but clearly identify the event type
    - Move all detailed descriptions to the "details" field
    - For events with long names, create a descriptive short title and put the full name in the details
    - For date ranges like "Aug 05-10, 2024", create an event for the start date (2024-08-05) and note the full range in details
    - If a specific time is mentioned for an event, include it in the details field
    - Categorize similar events with consistent title prefixes (e.g., "Exam: Midterm", "Deadline: Project")
    
    Return the results as a complete JSON array of ALL events you can find in the document, using this format:
    
    [
      {
        "title": "Very Short Title",
        "date": "YYYY-MM-DD",
        "details": "Full details and description of the event, including any specific times or additional information"
      },
      ...
    ]
    
    Return ONLY the JSON array with all the events, no additional text or markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const events = parseJsonResponse(text);
    console.log(`Successfully extracted ${events.length} events using Gemini AI`);
    return events;
  } catch (error) {
    console.error("Error using Gemini API for event extraction:", error);
    return []; // Return empty array on error
  }
}

/**
 * Fallback method to extract events if Gemini AI fails
 */
function extractEventsManually(cleanText) {
  let blocks = cleanText.split(/\n\s*\n|\r\n\s*\r\n/);
  
  // If first splitting method doesn't yield enough blocks, try alternatives
  if (blocks.length < 5) {
    blocks = cleanText.split(/\n{2,}|\r\n{2,}/);
  }
  
  // If still not enough blocks, use simpler line-by-line approach
  if (blocks.length < 5) {
    blocks = cleanText.split(/\n|\r\n/).map(line => line.trim()).filter(line => line);
  }
  
  const events = [];
  
  // Regex to detect various date formats commonly found in academic calendars
  const dateRegex = /(\d{1,2}(?:-\d{1,2})?\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2}(?:-\d{1,2})?,?\s+\d{4})/i;
  
  // Enhanced keywords for academic calendars
  const eventKeywords = [
    "commencement", "holiday", "exam", "semester", "break", "registration", 
    "orientation", "workshop", "submission", "deadline", "meeting",
    "lecture", "ceremony", "festival", "celebration", "vacation", "recess",
    "assessment", "assignment", "practical", "viva", "admissions", "convocation",
    "results", "announcement", "project", "presentation", "thesis", "term",
    "evaluation", "mid-term", "classes", "begin", "end", "last date"
  ];
  
  // Process each text block to extract events
  blocks.forEach((block, index) => {
    // Skip empty blocks
    if (!block.trim()) return;
    
    const lines = block.split(/\n|\r\n/).map(l => l.trim()).filter(l => l);
    if (!lines.length) return;
    
    // Skip blocks that are clearly headers or non-event content
    if (/^(Sr\. No\.|Agnel Charities|Institute Academic|Term Outline|Other Activities|Activity|Date|S\. No\.|Page|Academic Calendar|INDEX|CONTENTS)/i.test(lines[0])) {
      return;
    }
    
    // Try to find a date in the block
    const match = block.match(dateRegex);
    if (match) {
      let dateStr = match[1];
      let title = "";
      
      // Extract title - find first meaningful line that isn't a number or the date itself
      for (const line of lines) {
        // Skip if it's just a number, contains the date, or is too short
        if (/^\d+$/.test(line) || line.includes(dateStr) || line.length < 3) {
          continue;
        }
        
        // Skip if it looks like a page header
        if (/^page \d+$/i.test(line)) {
          continue;
        }
        
        // Use this line as the title
        title = line;
        break;
      }
      
      // If no suitable title found, look for lines with event keywords
      if (!title) {
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (eventKeywords.some(keyword => lowerLine.includes(keyword))) {
            title = line;
            break;
          }
        }
      }
      
      // If still no title found, use a generic one with the date
      if (!title) {
        title = `Event on ${dateStr}`;
      }
      
      // Limit title length to 25 characters
      if (title.length > 25) {
        const fullTitle = title;
        title = title.substring(0, 22) + "...";
        // Add the full title to details
        const detailsArr = lines.filter(line => line !== fullTitle);
        detailsArr.unshift(`Full title: ${fullTitle}`);
        details = detailsArr.join("\n");
      } else {
        // Include additional details from the block
        details = lines.filter(line => line !== title).join("\n");
      }
      
      // Parse and validate the date
      let parsed;
      if (dateStr.includes("-")) {
        // Handle date ranges
        const rangeParts = dateStr.split('-');
        const firstDate = rangeParts[0].trim();
        
        // Extract month and year from the second part
        const monthYear = rangeParts[1].trim().split(' ');
        if (monthYear.length >= 2) {
          const completeFirstDate = `${firstDate} ${monthYear.join(' ')}`;
          parsed = parseDateStr(completeFirstDate);
        } else {
          parsed = parseDateStr(dateStr);
        }
      } else {
        parsed = parseDateStr(dateStr);
      }
      
      // Skip invalid dates
      if (!parsed) {
        return;
      }
      
      // Create Date object to validate the parsed date
      const d = new Date(parsed + "T00:00:00");
      if (isNaN(d.getTime())) {
        return;
      }
      
      // Create and add the event object to results
      events.push({
        title: title,
        date: d.toISOString(),
        details: details,
        importedFromPdf: true, // Mark as imported from PDF
        notifications: {
          dayBefore: true,
          dayOf: true,
          atTime: false
        },
        notificationStatus: {
          dayBeforeSent: false,
          dayOfSent: false,
          atTimeSent: false
        }
      });
    }
  });
  
  return events;
}

/**
 * Main function to extract events from PDF content
 * First tries with Gemini API, falls back to manual extraction if needed
 */
async function extractEventsFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    console.log("PDF content extracted, processing text...");
    
    // Clean text to remove special characters that might interfere with parsing
    const cleanText = data.text.replace(/[^\x20-\x7E\n\r]/g, " ");
    
    // First try using Gemini AI for better extraction
    let events = [];
    try {
      events = await processTextWithGemini(cleanText);
      
      // If Gemini returned events, process them to ensure they have the correct format
      if (events && events.length > 0) {
        events = events.map(event => {
          // Create a standardized event object
          let dateObj;
          try {
            // Try to parse the date directly
            dateObj = new Date(event.date);
            
            // If invalid, try to fix common format issues
            if (isNaN(dateObj.getTime())) {
              // Try different date format transformations
              const dateParts = event.date.split('-');
              if (dateParts.length === 3) {
                dateObj = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00`);
              }
            }
          } catch (e) {
            // If date parsing fails, create a placeholder date
            dateObj = new Date();
            console.log(`Invalid date format for event: ${event.title}`);
          }
          
          // Make sure title is not too long
          let title = event.title;
          let details = event.details || "";
          
          if (title.length > 25) {
            const fullTitle = title;
            title = title.substring(0, 22) + "...";
            if (!details.includes(fullTitle)) {
              details = `Full title: ${fullTitle}\n\n${details}`.trim();
            }
          }
          
          return {
            title: title,
            date: dateObj.toISOString(),
            details: details,
            importedFromPdf: true,
            notifications: {
              dayBefore: true,
              dayOf: true,
              atTime: false
            },
            notificationStatus: {
              dayBeforeSent: false,
              dayOfSent: false,
              atTimeSent: false
            }
          };
        });
        
        // Filter out events with invalid dates
        events = events.filter(event => {
          const d = new Date(event.date);
          return !isNaN(d.getTime());
        });
      }
    } catch (geminiError) {
      console.error("Error using Gemini for extraction, falling back to manual method:", geminiError);
      events = [];
    }
    
    // If no events from Gemini or an error occurred, fall back to manual extraction
    if (!events || events.length === 0) {
      console.log("Falling back to manual extraction method");
      events = extractEventsManually(cleanText);
    }
    
    console.log(`Successfully extracted ${events.length} events from PDF`);
    return events;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF: " + error.message);
  }
}

module.exports = { extractEventsFromPDF };
