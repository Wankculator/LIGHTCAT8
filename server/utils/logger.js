const fs = require('fs');
const path = require('path');
const util = require('util');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const errorLogPath = path.join(logsDir, 'error.log');
const combinedLogPath = path.join(logsDir, 'combined.log');
const rgbPaymentsLogPath = path.join(logsDir, 'rgb-payments.log');

// Create write streams
const errorStream = fs.createWriteStream(errorLogPath, { flags: 'a' });
const combinedStream = fs.createWriteStream(combinedLogPath, { flags: 'a' });
const rgbPaymentsStream = fs.createWriteStream(rgbPaymentsLogPath, { flags: 'a' });

// Helper function to format log entries
function formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? util.inspect(meta, { depth: 3 }) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}\n`;
}

// Logger object
const logger = {
    error: (message, meta) => {
        const logEntry = formatLog('error', message, meta);
        errorStream.write(logEntry);
        combinedStream.write(logEntry);
        console.error(logEntry.trim());
    },
    
    warn: (message, meta) => {
        const logEntry = formatLog('warn', message, meta);
        combinedStream.write(logEntry);
        console.warn(logEntry.trim());
    },
    
    info: (message, meta) => {
        const logEntry = formatLog('info', message, meta);
        combinedStream.write(logEntry);
        console.log(logEntry.trim());
    },
    
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'testnet') {
            const logEntry = formatLog('debug', message, meta);
            combinedStream.write(logEntry);
            console.log(logEntry.trim());
        }
    },
    
    rgbPayment: (message, meta) => {
        const logEntry = formatLog('rgb', message, meta);
        rgbPaymentsStream.write(logEntry);
        combinedStream.write(logEntry);
        console.log(logEntry.trim());
    }
};

// Handle process exit
process.on('exit', () => {
    errorStream.end();
    combinedStream.end();
    rgbPaymentsStream.end();
});

module.exports = logger;
