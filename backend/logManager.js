const fs = require('fs');
const path = require('path');

// Configuration
const logsDir = path.join(__dirname, 'logs');
const maxAgeDays = 30; // Keep logs for 30 days by default

/**
 * Cleans up log files older than the specified age
 */
function cleanupOldLogs() {
  if (!fs.existsSync(logsDir)) {
    console.error(`Logs directory does not exist at ${logsDir}`);
    return;
  }

  const files = fs.readdirSync(logsDir);
  const now = new Date();
  let deletedCount = 0;
  let errorCount = 0;
  
  files.forEach(file => {
    try {
      // Extract date from filename (format: type-YYYY-MM-DD.log)
      const match = file.match(/-(\d{4}-\d{2}-\d{2})\.log$/);
      if (!match) return; // Skip files that don't match the pattern
      
      const dateStr = match[1];
      const fileDate = new Date(dateStr);
      
      // Calculate age in days
      const ageInMs = now.getTime() - fileDate.getTime();
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
      
      if (ageInDays > maxAgeDays) {
        // Delete the log file
        fs.unlinkSync(path.join(logsDir, file));
        deletedCount++;
      }
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log(`Log cleanup complete: ${deletedCount} files deleted, ${errorCount} errors encountered.`);
}

// Allow running directly or importing as a module
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const customMaxAgeDays = parseInt(args[0], 10);
  
  if (!isNaN(customMaxAgeDays) && customMaxAgeDays > 0) {
    cleanupOldLogs(customMaxAgeDays);
  } else {
    cleanupOldLogs();
  }
} else {
  // Export for use in other modules
  module.exports = { cleanupOldLogs };
} 