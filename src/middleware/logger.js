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
    // Extract the objectId and objectType from URL or response body if available
    const { objectId, objectType } = extractObjectId(req, body);

    // Parse response body to check for the status
    let responseJson;
    try {
      responseJson = JSON.parse(body);
    } catch (e) {
      responseJson = null;
    }

    // Log details
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      user: username,
      objectId: objectId || null,
      objectType: objectType || null,
      requestBody: req.body,
      responseBody: body
    };

    // If it's a PATCH method and the status is changed to "passive", add a custom message
    if (req.method === 'PATCH' && responseJson && responseJson.rawMaterial && responseJson.rawMaterial.status === 'passive') {
      logEntry.details = 'Stoktan çıkışı yapılmıştır';
    }

    // Write log entry as a single JSON string
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');

    originalSend.call(this, body);
  };

  next();
};

// Function to extract the objectId and objectType from request URL or response body
const extractObjectId = (req, body) => {
  let objectId = null;
  let objectType = null;

  // Example: Extract objectId and objectType from URL
  const urlMatch = req.originalUrl.match(/\/api\/(\w+)\/([^\/]+)/);
  if (urlMatch) {
    objectType = urlMatch[1]; // The first capture group is the type (e.g., "rawMaterial", "stock")
    objectId = urlMatch[2];   // The second capture group is the objectId
    return { objectId, objectType };
  }

  // Example: Extract objectId and objectType from response body
  try {
    const responseJson = JSON.parse(body);
    if (responseJson.rawMaterial && responseJson.rawMaterial._id) {
      objectId = responseJson.rawMaterial._id;
      objectType = 'rawMaterial';
    } else if (responseJson.stock && responseJson.stock._id) {
      objectId = responseJson.stock._id;
      objectType = 'stock';
    }
  } catch (e) {
    console.error('Error parsing response JSON:', e);
  }

  return { objectId, objectType };
};

// Function to filter logs based on objectId, username, or objectType
const filterLogs = (objectId, username, objectType) => {
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
    .filter(log => log &&
      (objectId ? log.objectId === objectId : true) &&
      (username ? log.user === username : true) &&
      (objectType ? log.objectType === objectType : true)
    );
  
  return filteredLogs;
};

module.exports = { logger, filterLogs };
