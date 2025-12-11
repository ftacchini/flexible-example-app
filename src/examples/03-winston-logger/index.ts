import "reflect-metadata";
import { FlexibleApp, FlexibleLoggerModule } from "flexible-core";
import { DecoratorsFrameworkModule, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModule } from "flexible-http";
import { HelloController } from "./hello-controller";
import { WinstonLoggerModule } from "./winston-logger-module";
import winston from "winston";

export function createApplication(port?: number, logger?: FlexibleLoggerModule): FlexibleApp {
    const httpPort = port || parseInt(process.env.PORT || "3000", 10);

    const httpEventSource = HttpModule.builder()
        .withPort(httpPort)
        .build();

    const decoratorsFramework = DecoratorsFrameworkModule.builder()
        .withControllerLoader(new ExplicitControllerLoader([
            HelloController
        ]))
        .build();

    const builder = FlexibleApp.builder()
        .addEventSource(httpEventSource)
        .addFramework(decoratorsFramework);

    if (logger) {
        builder.withLogger(logger);
    }

    return builder.createApp();
}

// Only run if this is the main module
if (require.main === module) {
    // Configure Winston logger for production use
    const winstonLogger = new WinstonLoggerModule({
        level: process.env.LOG_LEVEL || 'debug',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
        transports: [
            // Console transport with colorized output for development
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
                        let msg = `${timestamp} [${level}]: ${message}`;
                        // Only show metadata if it exists and is not empty
                        const metadataKeys = Object.keys(metadata).filter(key => key !== 'level' && key !== 'message' && key !== 'timestamp');
                        if (metadataKeys.length > 0) {
                            const filteredMetadata: any = {};
                            metadataKeys.forEach(key => filteredMetadata[key] = metadata[key]);
                            msg += ` ${JSON.stringify(filteredMetadata)}`;
                        }
                        return msg;
                    })
                )
            }),
            // File transport for errors
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.json()
            }),
            // File transport for all logs
            new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.json()
            })
        ]
    });

    const application = createApplication(undefined, winstonLogger);
    application.run().then(status => {
        console.log("Application started:", JSON.stringify(status));
    });
}