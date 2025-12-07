import { ContainerModule, Container } from "inversify";
import { FlexibleLoggerModule } from "flexible-core";
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

    public get container(): ContainerModule {
        return new ContainerModule(({ bind }) => {
            bind(WinstonLogger.TYPE)
                .toDynamicValue(() => new WinstonLogger(this.config))
                .inSingletonScope();
        });
    }

    public getInstance(container: Container): WinstonLogger {
        return container.get(this.loggerType);
    }

    public get loggerType(): symbol {
        return WinstonLogger.TYPE;
    }
}
