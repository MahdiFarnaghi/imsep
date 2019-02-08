var winston = require('winston');
var path = require('path');
var fs = require('fs');

var logDirectory = path.join(__dirname, '../log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);// ensure log directory exists
var options = {
    errorfile: {
        level: 'error',
        filename: path.join(logDirectory, 'app_errors.log'),
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    file: {
        level: 'info',
        filename: path.join(logDirectory, 'app.log'),
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    }
};
// instantiate a new Winston Logger with the settings defined above
var logger =  winston.createLogger({
    transports: [
        new winston.transports.File(options.errorfile),
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that can be used by `morgan`
logger.stream = {
    write: function (message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    },
};

module.exports = logger;