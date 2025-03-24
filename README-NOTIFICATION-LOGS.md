# EduSage Notification Logging System

## Overview
This system saves notification logs to files instead of displaying them in the console. This improves server performance and allows for better log management and analysis.

## Log Files
- Logs are stored in the `backend/logs` directory
- Files are named in the format: `type-YYYY-MM-DD.log` (e.g., `notification-2025-03-24.log`)
- Two types of logs are currently supported:
  - `notification`: Event notification activities
  - `system`: System-level notification service events

## Log Format
Each log entry includes:
- Timestamp in ISO format
- Message content
- Example: `[2025-03-24T00:33:09.241Z] Checking for notifications at 2025-03-24T00:33:09.241Z`

## Utilities

### Viewing Logs
Use the `viewNotificationLogs.js` script to view logs:

```bash
# View today's notification logs (default)
node backend/viewNotificationLogs.js

# View logs for a specific date
node backend/viewNotificationLogs.js 2025-03-24

# View system logs for a specific date
node backend/viewNotificationLogs.js 2025-03-24 system
```

### Log Management
The system includes automatic log cleanup:
- Logs are kept for 30 days by default
- Cleanup runs automatically once per day
- Manual cleanup can be triggered with:

```bash
# Clean up logs older than default 30 days
node backend/logManager.js

# Clean up logs older than X days
node backend/logManager.js 15
```

## Implementation Details
- Logs are created and managed by the `logToFile` function in `server.js`
- Log rotation is handled by `cleanupOldLogs` in `logManager.js`
- The server automatically creates the logs directory if it doesn't exist

## Benefits
- Reduced console clutter
- Persistent log history
- Ability to analyze notification patterns
- Easier debugging of notification-related issues 