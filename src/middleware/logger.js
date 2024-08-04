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
    // Log the primary line
    const logPrimaryLine = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - User: ${username}\n`;

    // Log the JSON object with request body and response
    const logDetails = {
      requestBody: req.body,
      responseBody: body
    };
    
    fs.appendFileSync(logFilePath, logPrimaryLine);
    fs.appendFileSync(logFilePath, JSON.stringify(logDetails, null, 2) + '\n');
    
    originalSend.call(this, body);
  };

  next();
};

module.exports = logger;
