# flexible-example-app

Example Flexible application demonstrating:
- HTTP event source with decorators framework
- Winston logger integration
- Structured logging with context
- Controller-based routing
- **Child container architecture** for composable security layers
- TSyringe dependency injection patterns

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

## Examples

### 1. Simple HTTP Server (`01-simple-http`)
Basic HTTP server with decorator-based controllers.

### 2. Composable Security (`02-composable-security`)
**Multi-layer architecture using child containers** - demonstrates how to build composable applications with security layers.

### 3. Winston Logger (`03-winston-logger`)
Production-ready logging with Winston integration.

## Endpoints

### Winston Logger Example (Default)
- `GET /world` - Returns `{"some":"world"}` with structured logging

### Composable Security Example
- `GET /users` - Security layer → Business layer (logs security check)
- `GET /profile` - Security layer → Business layer (logs security check)
- `POST /createUser` - Security layer → Business layer with request body

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
import { inject, injectable } from "tsyringe";

@injectable()
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

## Composable Security Architecture

The `02-composable-security` example demonstrates **child container architecture** for building layered applications with TSyringe:

### Architecture Overview

```
┌─────────────────────────────────────┐
│     Main Container (Shared)         │
│  Logger, BusinessEventSource        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│  Security   │  │  Business   │
│  Container  │  │  Container  │
│  (Child)    │  │  (Child)    │
└─────────────┘  └─────────────┘
```

### Key Benefits

- **True Isolation**: Each layer has its own container scope
- **Shared Dependencies**: Common services available to all layers
- **Override Capability**: Child containers can override parent bindings
- **Clean Architecture**: Clear separation of concerns

### Implementation Example

```typescript
import { FlexibleContainer, DelegateEventSource } from "flexible-core";

// ============================================
// Main Container (Shared Bindings)
// ============================================
const mainContainer = new FlexibleContainer();
const businessEventSource = new DelegateEventSource();

// Register shared services
mainContainer.registerValue("NextLayer", businessEventSource);

// ============================================
// Security Layer (Child Container)
// ============================================
const securityFramework = DecoratorsFrameworkModule.builder()
    .withControllerLoader(new ExplicitControllerLoader([SecurityController]))
    .build();

const securityApp = FlexibleApp.builder()
    .addModule(httpModule)
    .addEventSource(httpModule)  // Starts HTTP server
    .addFramework(securityFramework)
    .withContainer(mainContainer)  // Uses main container directly
    .createApp();

// ============================================
// Business Layer (Child Container)
// ============================================
const businessContainer = mainContainer.createChild();

const businessFramework = DecoratorsFrameworkModule.builder()
    .withControllerLoader(new ExplicitControllerLoader([BusinessController]))
    .build();

const businessApp = FlexibleApp.builder()
    .addEventSource(businessEventSourceModule)
    .addFramework(businessFramework)
    .withContainer(businessContainer)  // Uses child container
    .createApp();
```

### Security Controller

```typescript
@injectable()
@Controller()
export class SecurityController {
    constructor(
        @inject("NextLayer") private nextLayer: DelegateEventSource,
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {}

    @Route(Everything)
    public async handleRequest(event: HttpEvent): Promise<any> {
        this.logger.info("Security layer processing request", {
            method: event.method,
            path: event.path,
            clientIp: event.clientIp
        });

        // Security checks here...

        // Delegate to business layer
        return await this.nextLayer.generateEvent(event);
    }
}
```

### Business Controller

```typescript
@injectable()
@Controller()
export class BusinessController {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {}

    @Route(HttpGet)
    public getUsers(): any {
        this.logger.info("Business layer: Getting users");
        return { users: ["Alice", "Bob", "Charlie"] };
    }

    @Route(HttpPost)
    public createUser(@FromBody() userData: any): any {
        this.logger.info("Business layer: Creating user", { userData });
        return { success: true, user: userData };
    }
}
```

### Running the Composable Security Example

```bash
# Build the project
npm run build

# Run the composable security example
node dist/src/examples/02-composable-security/index.js

# Test the layered architecture
curl http://localhost:3000/users
curl http://localhost:3000/profile
curl -X POST http://localhost:3000/createUser \
  -H "Content-Type: application/json" \
  -d '{"name":"Dave","email":"dave@example.com"}'
```

**Expected Flow:**
1. HTTP request → Security Layer (logs security check)
2. Security Layer → Business Layer (via DelegateEventSource)
3. Business Layer → Response (logs business logic)

## Project Structure

```
src/
├── examples/
│   ├── 01-simple-http/
│   │   ├── index.ts                    # Basic HTTP server
│   │   └── hello-controller.ts         # Simple controller
│   ├── 02-composable-security/
│   │   ├── index.ts                    # Child container architecture
│   │   ├── security-controller.ts      # Security layer controller
│   │   ├── business-controller.ts      # Business layer controller
│   │   └── security-middleware.ts      # Security middleware
│   └── 03-winston-logger/
│       ├── index.ts                    # Winston logger integration
│       ├── hello-controller.ts         # Controller with logging
│       ├── winston-logger.ts           # Winston implementation
│       └── winston-logger-module.ts    # Winston DI module

test/
├── unit-test/
│   ├── child-container-inheritance.spec.ts  # Child container tests
│   └── unit-test.spec.ts
└── integration-test/
    ├── composable-security.spec.ts     # Multi-layer architecture tests
    ├── simple-http.spec.ts             # Basic HTTP tests
    └── winston-logging.spec.ts         # Winston file logging tests

logs/
├── error.log                           # Error level logs (JSON)
└── combined.log                        # All logs (JSON)
```

## Migration from InversifyJS (v1.0.x → v1.1.0+)

This example app has been updated to use TSyringe instead of InversifyJS. Key changes:

### Decorator Updates

```typescript
// Before (InversifyJS)
import { inject, injectable } from "inversify";

@injectable()
@Controller()
export class HelloController {
    constructor(@inject(TYPES.Logger) private logger: FlexibleLogger) {}
}

// After (TSyringe)
import { inject, injectable } from "tsyringe";

@injectable()
@Controller()
export class HelloController {
    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {}
}
```

### Container Usage

```typescript
// Before (InversifyJS)
import { Container } from "inversify";
const container = new Container();
container.bind(TYPES.Logger).toConstantValue(logger);

// After (TSyringe)
import { FlexibleContainer } from "flexible-core";
const container = new FlexibleContainer();
container.registerValue(FLEXIBLE_APP_TYPES.LOGGER, logger);
```

### Child Containers (New Feature)

```typescript
// Now available with TSyringe
const mainContainer = new FlexibleContainer();
const childContainer = mainContainer.createChild();

// Child inherits parent bindings but can override them
childContainer.registerValue("NextLayer", businessEventSource);
```

## Documentation

- [WINSTON_LOGGER.md](WINSTON_LOGGER.md) - Detailed Winston integration guide
- [flexible-core](https://github.com/ftacchini/flexible-core) - Core framework documentation
- [flexible-decorators](https://github.com/ftacchini/flexible-decorators) - Decorator framework documentation

## License

MIT
