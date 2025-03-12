/**
 * Upgrader logger.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import winston from 'winston';
import 'winston-daily-rotate-file'
const { combine, errors, label, printf, timestamp, uncolorize } = winston.format;


const loggingFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
});

const consoleTransport = new winston.transports.Console({
    level: 'info'
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
    level: 'debug', 
    filename: 'logs/teddy-upgrader-%DATE%.log', 
    datePattern: 'YYYY-MM-DD', 
    maxFiles: '14d', 
    maxSize: '10m'
});

const logger = winston.createLogger({
    defaultMeta: {
        service: 'teddy-upgrader'
    }, 
    format: combine(
        errors({ 
            stack: true
        }), 
        label({ 
            label: 'Teddy Upgrader'
        }),
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        uncolorize(), 
        loggingFormat
    ),
    transports: [
        consoleTransport, 
        fileRotateTransport
    ], 
    exceptionHandlers: [
        consoleTransport, 
        fileRotateTransport
    ], 
    exitOnError: true
});

export default logger;
