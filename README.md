# flexible-example-app

Example Flexible application demonstrating:
- HTTP event source with decorators framework
- Winston logger integration
- Structured logging with context
- Controller-based routing

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run the application
npm start

# Run tests
npm test
```

The application will start on port 3000 (configurable via `PORT` environment variable).

## Endpoints

- `GET /world` - Returns `{"some":"world"}` with structured logging

## Winston Logger Integration

This example demonstrates how to integrate [Winston](https://github.com/winstonjs/winston) with Flexible framework for production-ready logging.

### Features

- **Multiple Transports**: Console (colorized) and file logging
- **Structured Logging**: JSON format with context
- **Log Levels**: Configurable via `LOG_LEVEL` environment variable
- **File Rotation**: Separate error.log and combined.log files
- **Request Tracking**: Automatic request ID propagation

### Configuration

The Winston logger is configured in `src/index.ts`:

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
```

### Example Output

**Console:**
```
2025-12-05T22:47:42.059Z [debug]: Setting up logger...
2025-12-05T22:47:47.385Z [debug]: HTTP request received {"requestId":"1764974867385-x09e","method":"GET","path":"/world","clientIp":"127.0.0.1"}
2025-12-05T22:47:47.388Z [info]: World endpoint called {"endpoint":"/world"}
2025-12-05T22:47:47.391Z [debug]: Response sent {"requestId":"1764974867385-x09e","statusCode":200}
```

**logs/combined.log:**
```json
{"level":"debug","message":"Setting up logger...","timestamp":"2025-12-05T22:47:42.059Z"}
{"level":"info","message":"World endpoint called","endpoint":"/world","timestamp":"2025-12-05T22:47:47.388Z"}
```

### Using Logger in Controllers

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject } from "inversify";

@Controller()
export class HelloController {
    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {}

    @Route(HttpGet)
    public world(): any {
        this.logger.info("World endpoint called", {
            endpoint: "/world",
            timestamp: new Date().toISOString()
        });

        return { some: "world" };
    }
}
```

### Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `LOG_LEVEL` - Winston log level: debug, info, warn, error (default: debug)
- `NODE_ENV` - Environment: development, production

### Running with Different Log Levels

```bash
# Debug level (all logs)
npm start

# Info level and above
LOG_LEVEL=info npm start

# Warnings and errors only
LOG_LEVEL=warn npm start

# Production mode
NODE_ENV=production LOG_LEVEL=info npm start
```

## Project Structure

```
src/
├── index.ts                    # Application entry point with Winston config
├── hello-controller.ts         # Example controller with logging
├── winston-logger.ts           # Winston FlexibleLogger implementation
└── winston-logger-module.ts    # Winston DI module

test/
├── unit-test/
│   └── hello-controller.spec.ts
└── integration-test/
    ├── integ-test.spec.ts      # HTTP endpoint tests
    └── winston-logging.spec.ts # Winston file logging tests

logs/
├── error.log                   # Error level logs (JSON)
└── combined.log                # All logs (JSON)
```

## Documentation

- [WINSTON_LOGGER.md](WINSTON_LOGGER.md) - Detailed Winston integration guide
- [flexible-core](https://github.com/ftacchini/flexible-core) - Core framework documentation

## License

MIT
