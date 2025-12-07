import winston from 'winston';
import { FlexibleLogger, LogContext } from 'flexible-core';

/**
 * Winston implementation of FlexibleLogger
 *
 * This demonstrates how to integrate Winston with the Flexible framework.
 * Winston provides advanced features like:
 * - Multiple transports (file, console, HTTP, etc.)
 * - Log rotation
 * - Custom formatters
 * - Query and streaming logs
 */
export class WinstonLogger implements FlexibleLogger {
    public static readonly TYPE = Symbol("WinstonLogger");

    private winstonInstance: winston.Logger;

    constructor(config?: winston.LoggerOptions) {
        this.winstonInstance = winston.createLogger(config || {
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
                            let msg = `${timestamp} [${level}]: ${message}`;
                            if (Object.keys(metadata).length > 0) {
                                msg += ` ${JSON.stringify(metadata)}`;
                            }
                            return msg;
                        })
                    )
                })
            ]
        });
    }

    emergency(message: string, context?: LogContext): void {
        // Winston doesn't have emergency, map to error with emergency flag
        this.winstonInstance.error(message, { ...context, severity: 'emergency' });
    }

    alert(message: string, context?: LogContext): void {
        // Winston doesn't have alert, map to error with alert flag
        this.winstonInstance.error(message, { ...context, severity: 'alert' });
    }

    crit(message: string, context?: LogContext): void {
        // Winston doesn't have crit, map to error with critical flag
        this.winstonInstance.error(message, { ...context, severity: 'critical' });
    }

    error(message: string, context?: LogContext): void {
        this.winstonInstance.error(message, context);
    }

    warning(message: string, context?: LogContext): void {
        this.winstonInstance.warn(message, context);
    }

    notice(message: string, context?: LogContext): void {
        // Winston doesn't have notice, map to info
        this.winstonInstance.info(message, { ...context, severity: 'notice' });
    }

    info(message: string, context?: LogContext): void {
        this.winstonInstance.info(message, context);
    }

    debug(message: string, context?: LogContext): void {
        this.winstonInstance.debug(message, context);
    }
}
