const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Log = require('../models/log'); // Import your Log model
const LastLog = require('../models/lastLog'); // Correct path to the LastLog model
const logFilePath = path.join(__dirname, '..', 'logs', 'access.log');

// Schedule the cron job
cron.schedule('0 0 * * *', async () => {
  console.log('Running task at midnight: Saving new logs from access.log to the database');

  fs.readFile(logFilePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading the log file:', err);
      return;
    }

    const logEntries = data.split('\n').filter(line => line.trim() !== '');

    try {
      // Get the last saved log timestamp
      let lastLogEntry = await LastLog.findOne();
      let lastSavedTimestamp = lastLogEntry ? lastLogEntry.lastSavedTimestamp : new Date(0); // Default to epoch if no previous logs

      let newLogs = [];
      for (const entry of logEntries) {
        const logData = JSON.parse(entry); // Convert log entry to JSON

        // Only save logs that are newer than the last saved log
        if (new Date(logData.timestamp) > lastSavedTimestamp) {
          newLogs.push(logData);
        }
      }

      if (newLogs.length > 0) {
        // Save the new logs to the database
        await Log.insertMany(newLogs);

        // Update the last saved log timestamp to the latest log's timestamp
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

module.exports = cron;
