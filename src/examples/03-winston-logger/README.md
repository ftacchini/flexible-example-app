# Winston Logger Example

Production-ready Flexible application with Winston logger integration.

## Features

- HTTP event source with decorators framework
- **Winston logger** with multiple transports
- Structured logging with JSON format
- File logging (error.log, combined.log)
- Colorized console output
- Request tracking and context

## Running

```bash
# From the flexible-example-app root
npm run build
node dist/examples/03-winston-logger/index.js

# With custom log level
LOG_LEVEL=info node dist/examples/03-winston-logger/index.js

# Production mode
NODE_ENV=production LOG_LEVEL=info node dist/examples/03-winston-logger/index.js
```

## Endpoints

### GET /world
Returns a hello world message with structured logging.

```bash
curl http://localhost:3000/world
```

Response:
```json
{
  "some": "world"
}
```

## Winston Configuration

The Winston logger is configured with:

- **Console Transport**: Colorized output for development
- **File Transport (error.log)**: Error level logs in JSON format
- **File Transport (combined.log)**: All logs in JSON format
- **Timestamp**: ISO 8601 format
- **Error Stack Traces**: Full stack traces for errors

### Example Console Output

```
2025-12-05T23:00:00.000Z [debug]: Setting up logger...
2025-12-05T23:00:05.123Z [debug]: HTTP request received {"requestId":"1764974867385-x09e","method":"GET","path":"/world"}
2025-12-05T23:00:05.125Z [info]: World endpoint called {"endpoint":"/world","timestamp":"2025-12-05T23:00:05.125Z"}
2025-12-05T23:00:05.127Z [debug]: Response sent {"requestId":"1764974867385-x09e","statusCode":200}
```

### Example File Output (combined.log)

```json
{"level":"debug","message":"Setting up logger...","timestamp":"2025-12-05T23:00:00.000Z"}
{"level":"info","message":"World endpoint called","endpoint":"/world","timestamp":"2025-12-05T23:00:05.125Z"}
```

## Code Structure

```
03-winston-logger/
├── index.ts                    # Application entry point with Winston config
├── hello-controller.ts         # Controller with logging
├── winston-logger.ts           # Winston FlexibleLogger implementation
├── winston-logger-module.ts    # Winston DI module
├── WINSTON_LOGGER.md          # Detailed Winston guide
└── README.md                  # This file
```

## Using Logger in Controllers

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject } from "tsyringe";

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

## Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `LOG_LEVEL` - Winston log level: debug, info, warn, error (default: debug)
- `NODE_ENV` - Environment: development, production

## Log Levels

```bash
# Debug level (all logs)
node dist/examples/03-winston-logger/index.js

# Info level and above
LOG_LEVEL=info node dist/examples/03-winston-logger/index.js

# Warnings and errors only
LOG_LEVEL=warn node dist/examples/03-winston-logger/index.js
```

## Log Files

Logs are written to:
- `logs/error.log` - Error level logs only
- `logs/combined.log` - All logs

## Winston Integration Details

See [WINSTON_LOGGER.md](./WINSTON_LOGGER.md) for detailed documentation on:
- Winston configuration options
- Custom transports
- Log formatting
- Production best practices
- Performance considerations

## Next Steps

- See [01-simple-http](../01-simple-http) for basic HTTP example
- See [02-composable-security](../02-composable-security) for layered security
- See [Winston documentation](https://github.com/winstonjs/winston) for advanced features
