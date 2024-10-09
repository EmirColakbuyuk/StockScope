const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Log = require('../models/log'); // Import your Log model
const LastLog = require('../models/lastLog'); // Correct path to the LastLog model
const logFilePath = path.join(__dirname, '..', 'logs', 'access.log');

// Add a confirmation that cron is being initialized
console.log('Initializing cron job...');

// Schedule the cron job
cron.schedule('0 0 * * *', async () => {  // Schedule for midnight, adjust as necessary
  console.log('Running cron task: Saving new logs from access.log to the database');

  fs.readFile(logFilePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading the log file:', err);
      return;
    }

    const logEntries = data.split('\n').filter(line => line.trim() !== '');

    try {
      let lastLogEntry = await LastLog.findOne();
      let lastSavedTimestamp = lastLogEntry ? lastLogEntry.lastSavedTimestamp : new Date(0);

      let newLogs = [];
      for (const entry of logEntries) {
        try {
          const logData = JSON.parse(entry);

          if (new Date(logData.timestamp) > lastSavedTimestamp) {
            newLogs.push(logData);
          }
        } catch (parseError) {
          console.error('Error parsing log entry:', entry, parseError);
          continue;
        }
      }

      if (newLogs.length > 0) {
        await Log.insertMany(newLogs);

        const latestLogTimestamp = new Date(newLogs[newLogs.length - 1].timestamp);

        if (!lastLogEntry) {
          await LastLog.create({ lastSavedTimestamp: latestLogTimestamp });
        } else {
          lastLogEntry.lastSavedTimestamp = latestLogTimestamp;
          await lastLogEntry.save();
        }

        console.log('New logs successfully saved to the database.');
      } else {
        console.log('No new logs to save.');
      }
    } catch (error) {
      console.error('Error saving log to the database:', error);
    }
  });
});

console.log('Cron job scheduled.');
