const pdfParse = require("pdf-parse");

/**
 * Helper: Convert a date string like "04 January 2025" to "YYYY-MM-DD"
 */
function parseDateStr(dateStr) {
  const parts = dateStr.split(" ").filter(p => p);
  if (parts.length < 3) return null;
  let [day, monthName, year] = parts;
  if (day.length === 1) day = "0" + day;
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const monthIndex = monthNames.indexOf(monthName.toLowerCase());
  if (monthIndex === -1) return null;
  const monthNum = (monthIndex + 1).toString().padStart(2, "0");
  return `${year}-${monthNum}-${day}`;
}

/**
 * Extracts events from the provided PDF buffer.
 *
 * This updated version splits the text into blocks by double newlines.
 * It then filters out blocks that look like headers and uses a regex
 * to find a date in each block. If a valid date is found, the block’s first
 * line is taken as the event title.
 */
function extractEventsFromPDF(buffer) {
  return pdfParse(buffer).then((data) => {
    // For debugging, you might log the full text:
    // console.log(data.text);

    // Split text into blocks (this may need adjustment based on the PDF layout)
    const blocks = data.text.split(/\n\s*\n/);
    const events = [];
    // Regex to match a date (e.g., "04-10 January 2025" or "13 January 2025")
    const dateRegex = /(\d{1,2}(?:-\d{1,2})?\s+[A-Za-z]+\s+\d{4})/;
    blocks.forEach((block) => {
      const lines = block.split("\n").map(l => l.trim()).filter(l => l);
      if (!lines.length) return;
      // Skip blocks that are clearly headers or not events
      if (/^(Sr\. No\.|Agnel Charities|Institute Academic|Term Outline|Other Activities|Activity)$/i.test(lines[0])) {
        return;
      }
      // Try to find a date in the block
      const match = block.match(dateRegex);
      if (match) {
        let dateStr = match[1];
        // If the date is a range (e.g., "04-10 January 2025"), take the first part.
        if (dateStr.includes("-")) {
          dateStr = dateStr.split("-")[0].trim();
          // Optionally, append month and year from the full matched string if needed.
          const parts = match[0].split(" ");
          if (parts.length >= 3) {
            dateStr = dateStr + " " + parts[1] + " " + parts[2];
          }
        }
        const parsed = parseDateStr(dateStr);
        if (!parsed) {
          console.error("Invalid date parsed:", dateStr);
          return;
        }
        const d = new Date(parsed + "T00:00:00");
        if (isNaN(d.getTime())) {
          console.error("Invalid date object from parsed date:", parsed);
          return;
        }
        // Use the first line as title (you can adjust which line to use)
        const title = lines[0];
        events.push({
          title,
          date: d.toISOString(),
          time: "00:00:00",
          details: "", // You can further process the block to extract details if needed
        });
      }
    });
    return events;
  });
}

module.exports = { extractEventsFromPDF };
