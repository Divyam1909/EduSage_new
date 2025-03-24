const fs = require('fs');
const path = require('path');

// Configuration
const logsDir = path.join(__dirname, 'logs');
const args = process.argv.slice(2);
let date = new Date().toISOString().split('T')[0]; // default to today
let type = 'notification'; // default log type

// Parse command line arguments
if (args.length > 0) {
  // Check if date is provided (format: YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(args[0])) {
    date = args[0];
  }
}

if (args.length > 1) {
  // Check if type is provided
  type = args[1];
}

// Build log file path
const logFile = path.join(logsDir, `${type}-${date}.log`);

// Check if directory exists
if (!fs.existsSync(logsDir)) {
  console.error(`Error: Logs directory does not exist at ${logsDir}`);
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(logFile)) {
  console.error(`Error: No log file found for ${type} on ${date}`);
  console.log('Available log files:');
  
  // List available log files
  const files = fs.readdirSync(logsDir);
  files.forEach(file => {
    console.log(`- ${file}`);
  });
  
  process.exit(1);
}

// Read and display log content
try {
  const logContent = fs.readFileSync(logFile, 'utf8');
  console.log(`=== ${type} logs for ${date} ===\n`);
  console.log(logContent);
} catch (error) {
  console.error(`Error reading log file: ${error.message}`);
} 