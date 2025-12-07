# Winston Logger Integration

This example demonstrates how to integrate [Winston](https://github.com/winstonjs/winston) with the Flexible framework.

## Overview

Winston is a popular logging library for Node.js that provides:
- Multiple transports (console, file, HTTP, etc.)
- Log levels and filtering
- Custom formatters
- Log rotation and archiving
- Query and streaming logs

## Implementation

### 1. WinstonLogger (`src/winston-logger.ts`)

Implements the `FlexibleLogger` interface to bridge Winston with Flexible:

```typescript
export class WinstonLogger implements FlexibleLogger {
    private winstonInstance: winston.Logger;

    constructor(config?: winston.LoggerOptions) {
        this.winstonInstance = winston.createLogger(config);
    }

    debug(message: string, context?: LogContext): void {
        this.winstonInstance.debug(message, context);
    }

    // ... other log levels
}
```

### 2. WinstonLoggerModule (`src/winston-logger-module.ts`)

Integrates WinstonLogger with Flexible's dependency injection:

```typescript
export class WinstonLoggerModule implements FlexibleLoggerModule {
    constructor(private config?: winston.LoggerOptions) {}

    public get container(): ContainerModule {
        return new ContainerModule(({ bind }) => {
            bind(WinstonLogger.TYPE)
                .toDynamicValue(() => new WinstonLogger(this.config))
                .inSingletonScope();
        });
    }
}
```

### 3. Usage in Application (`src/index.ts`)

Configure Winston with multiple transports:

```typescript
const winstonLogger = new WinstonLoggerModule({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Colorized console output
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...metadata }) => {
                    return `${timestamp} [${level}]: ${message} ${JSON.stringify(metadata)}`;
                })
            )
        }),
        // Error logs to file
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        // All logs to file
        new winston.transports.File({
            filename: 'logs/combined.log'
        })
    ]
});

const app = FlexibleAppBuilder.instance
    .withLogger(winstonLogger)
    .createApp();
```

## Running the Example

```bash
# Install dependencies
npm install

# Run with default log level (debug)
npm start

# Run with custom log level
LOG_LEVEL=info npm start

# Run with production settings
NODE_ENV=production LOG_LEVEL=warn npm start
```

## Log Output

### Console (Development)
```
2025-12-05T10:30:00.000Z [debug]: Setting up logger...
2025-12-05T10:30:00.001Z [debug]: Logger setup done
2025-12-05T10:30:00.002Z [debug]: Setting up router...
2025-12-05T10:30:00.010Z [info]: HTTP request received {"requestId":"abc123","method":"GET","path":"/world","clientIp":"127.0.0.1"}
```

### File (logs/combined.log)
```json
{"level":"debug","message":"Setting up logger...","timestamp":"2025-12-05T10:30:00.000Z"}
{"level":"info","message":"HTTP request received","requestId":"abc123","method":"GET","path":"/world","clientIp":"127.0.0.1","timestamp":"2025-12-05T10:30:00.010Z"}
```

### File (logs/error.log)
```json
{"level":"error","message":"Request failed","requestId":"abc123","error":"Database connection timeout","timestamp":"2025-12-05T10:30:05.000Z"}
```

## Advanced Configuration

### Log Rotation

```typescript
import DailyRotateFile from 'winston-daily-rotate-file';

const winstonLogger = new WinstonLoggerModule({
    transports: [
        new DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});
```

### Custom Formatters

```typescript
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(metadata)}`;
});

const winstonLogger = new WinstonLoggerModule({
    format: winston.format.combine(
        winston.format.timestamp(),
        customFormat
    )
});
```

### Multiple Transports

```typescript
const winstonLogger = new WinstonLoggerModule({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' }),
        new winston.transports.Http({ host: 'log-server.com', port: 8080 })
    ]
});
```

## Benefits

1. **Production Ready**: Winston is battle-tested and widely used
2. **Flexible**: Multiple transports and formatters
3. **Performant**: Async logging with buffering
4. **Queryable**: Built-in query API for log analysis
5. **Extensible**: Easy to add custom transports

## Creating Your Own Logger

You can create a logger for any logging library by implementing `FlexibleLogger`:

```typescript
import { FlexibleLogger, LogContext } from 'flexible-core';

export class MyCustomLogger implements FlexibleLogger {
    debug(message: string, context?: LogContext): void {
        // Your implementation
    }

    info(message: string, context?: LogContext): void {
        // Your implementation
    }

    // ... other methods
}
```

Then wrap it in a module:

```typescript
export class MyCustomLoggerModule implements FlexibleLoggerModule {
    public get container(): ContainerModule {
        return new ContainerModule(({ bind }) => {
            bind(MyCustomLogger.TYPE)
                .to(MyCustomLogger)
                .inSingletonScope();
        });
    }

    public getInstance(container: Container): MyCustomLogger {
        return container.get(MyCustomLogger.TYPE);
    }

    public get loggerType(): symbol {
        return MyCustomLogger.TYPE;
    }
}
```

## See Also

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Flexible Core Logging](../flexible-core/docs/logging.md)
- [Pino Logger](https://github.com/pinojs/pino) - Alternative fast logger
