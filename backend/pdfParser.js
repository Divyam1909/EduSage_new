const pdfParse = require("pdf-parse");

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
 * Main function to extract events from PDF content
 * Parses the PDF, identifies event dates and titles, and returns structured event objects
 */
function extractEventsFromPDF(buffer) {
  return pdfParse(buffer).then((data) => {
    console.log("PDF content extracted, processing text...");
    
    // Clean text to remove special characters that might interfere with parsing
    const cleanText = data.text.replace(/[^\x20-\x7E\n\r]/g, " ");
    
    // Log a sample of the PDF text for debugging
    console.log("First 1000 characters of PDF text:");
    console.log(cleanText.substring(0, 1000));
    
    // Try different approaches to split the text into meaningful blocks
    let blocks = cleanText.split(/\n\s*\n|\r\n\s*\r\n/);
    
    // If first splitting method doesn't yield enough blocks, try alternatives
    if (blocks.length < 5) {
      console.log("Few blocks found with first method, trying alternative splitting");
      blocks = cleanText.split(/\n{2,}|\r\n{2,}/);
    }
    
    // If still not enough blocks, use simpler line-by-line approach
    if (blocks.length < 5) {
      console.log("Still few blocks, using line-by-line approach");
      blocks = cleanText.split(/\n|\r\n/).map(line => line.trim()).filter(line => line);
    }
    
    console.log(`Processing ${blocks.length} blocks of text`);
    
    const events = [];
    
    // Regex to detect various date formats commonly found in academic calendars
    const dateRegex = /(\d{1,2}(?:-\d{1,2})?\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2}(?:-\d{1,2})?,?\s+\d{4})/i;
    
    // Common keywords that help identify event titles in academic calendars
    const eventKeywords = [
      "commencement", "holiday", "exam", "semester", "break", "registration", 
      "orientation", "workshop", "submission", "deadline", "meeting",
      "lecture", "ceremony", "festival", "celebration", "vacation", "recess"
    ];
    
    // Process each text block to extract events
    blocks.forEach((block, index) => {
      // Skip empty blocks
      if (!block.trim()) return;
      
      const lines = block.split(/\n|\r\n/).map(l => l.trim()).filter(l => l);
      if (!lines.length) return;
      
      // Log a few sample blocks for debugging
      if (index < 5) {
        console.log(`Block ${index}:`, block.substring(0, 100));
      }
      
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
          console.log(`Skipping block ${index} - Invalid date format: "${dateStr}"`);
          return;
        }
        
        // Create Date object to validate the parsed date
        const d = new Date(parsed + "T00:00:00");
        if (isNaN(d.getTime())) {
          console.log(`Skipping block ${index} - Invalid date: "${parsed}"`);
          return;
        }
        
        // Include additional details from the block
        const details = lines.filter(line => line !== title).join("\n");
        
        console.log(`Found event: "${title}" on ${d.toISOString().split('T')[0]}`);
        
        // Create and add the event object to results
        events.push({
          title: title,
          date: d.toISOString(),
          time: "00:00:00",
          details: details,
          importedFromPdf: true // Mark as imported from PDF
        });
      }
    });
    
    console.log(`Successfully extracted ${events.length} events from PDF`);
    return events;
  }).catch(error => {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF: " + error.message);
  });
}

module.exports = { extractEventsFromPDF };
