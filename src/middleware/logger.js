const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'logs', 'access.log');

// Ensure the logs directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'logs'));
}

const logger = (req, res, next) => {
  const username = req.user ? req.user.username : 'Anonymous';

  // Capture the original send function
  const originalSend = res.send;

  // Wrap the send function to log the response
  res.send = function (body) {
    // Extract the objectId from URL or response body if available
    const objectId = extractObjectId(req, body);

    // Log details
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      user: username,
      objectId: objectId || null,
      requestBody: req.body,
    };

    // Write log entry as a single JSON string
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');

    originalSend.call(this, body);
  };

  next();
};

// Function to extract the objectId from request URL or response body
const extractObjectId = (req, body) => {
  // Example: Extract objectId from URL if it follows a specific pattern
  const urlMatch = req.originalUrl.match(/\/api\/\w+\/([^\/]+)/);
  if (urlMatch) return urlMatch[1];

  // Example: Extract objectId from response body if it contains it
  try {
    const responseJson = JSON.parse(body);
    if (responseJson.rawMaterial && responseJson.rawMaterial._id) return responseJson.rawMaterial._id;
  } catch (e) {
    // Handle JSON parse error
  }

  return null;
};

// Function to filter logs based on objectId or username
const filterLogs = (objectId, username) => {
  const logs = fs.readFileSync(logFilePath, 'utf-8').split('\n').filter(Boolean);
  const filteredLogs = logs
    .map(log => {
      try {
        return JSON.parse(log);
      } catch (e) {
        console.error('Error parsing log:', e);
        return null;
      }
    })
    .filter(log => log && (objectId ? log.objectId === objectId : true) && (username ? log.user === username : true));
  
  return filteredLogs;
};
module.exports = {logger,filterLogs};

