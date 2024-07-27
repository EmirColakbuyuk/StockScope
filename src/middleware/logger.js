const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'logs', 'access.log');

// Ensure the logs directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'logs'));
}

const logger = (req, res, next) => {
  const username = req.user ? req.user.username : 'Anonymous';
  const log = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - User: ${username}\n`;
  fs.appendFileSync(logFilePath, log);
  next();
};

module.exports = logger;
