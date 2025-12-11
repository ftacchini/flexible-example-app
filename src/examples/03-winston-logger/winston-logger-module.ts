import { DependencyContainer } from "tsyringe";
import { FlexibleLoggerModule, FlexibleContainer } from "flexible-core";
import { WinstonLogger } from "./winston-logger";
import winston from "winston";

/**
 * Winston Logger Module for Flexible Framework
 *
 * This module integrates Winston with the Flexible framework's dependency injection system.
 *
 * Example usage:
 * ```typescript
 * const app = FlexibleApp.builder()
 *     .withLogger(new WinstonLoggerModule({
 *         level: 'info',
 *         format: winston.format.json(),
 *         transports: [
 *             new winston.transports.File({ filename: 'error.log', level: 'error' }),
 *             new winston.transports.File({ filename: 'combined.log' })
 *         ]
 *     }))
 *     .createApp();
 * ```
 */
export class WinstonLoggerModule implements FlexibleLoggerModule {

    constructor(private config?: winston.LoggerOptions) {}

    public register(container: DependencyContainer): void {
        container.register(WinstonLogger.TYPE, {
            useFactory: () => new WinstonLogger(this.config)
        });
    }

    public getInstance(container: FlexibleContainer): WinstonLogger {
        return container.resolve(this.loggerType);
    }

    public get loggerType(): symbol {
        return WinstonLogger.TYPE;
    }
}
