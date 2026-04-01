const fs = require('fs');
const path = require('path');
const moment = require('moment');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'system.log');

const logger = {
  info: (message, meta = {}) => {
    const logEntry = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] INFO: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
  },
  
  error: (message, error = null) => {
    const errorStack = error && error.stack ? `\nStack: ${error.stack}` : '';
    const logEntry = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ERROR: ${message} ${error ? error.message : ''}${errorStack}\n`;
    console.error(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
  },

  warn: (message, meta = {}) => {
    const logEntry = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] WARN: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;
    console.warn(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
  },

  // Log specific events (to be used by Notification Service)
  event: (type, data) => {
    const logEntry = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] EVENT [${type}]: ${JSON.stringify(data)}\n`;
    fs.appendFileSync(logFile, logEntry);
  }
};

module.exports = logger;
