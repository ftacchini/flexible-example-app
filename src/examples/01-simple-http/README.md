# Simple HTTP Example

A minimal Flexible application demonstrating basic HTTP routing with the decorators framework.

## Features

- HTTP event source
- Decorator-based controllers
- GET and POST endpoints
- No external dependencies (uses built-in console logger)

## Running

```bash
# From the flexible-example-app root
npm run build
node dist/examples/01-simple-http/index.js

# Or with custom port
PORT=8080 node dist/examples/01-simple-http/index.js
```

## Endpoints

### GET /world
Returns a hello world message.

```bash
curl http://localhost:3000/world
```

Response:
```json
{
  "message": "Hello, World!",
  "timestamp": "2025-12-05T23:00:00.000Z"
}
```

### POST /echo
Echoes back the request body.

```bash
curl -X POST http://localhost:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","age":30}'
```

Response:
```json
{
  "message": "Echo response",
  "received": {
    "name": "Alice",
    "age": 30
  },
  "timestamp": "2025-12-05T23:00:00.000Z"
}
```

## Code Structure

```
01-simple-http/
├── index.ts              # Application entry point
├── hello-controller.ts   # Controller with routes
└── README.md            # This file
```

## Key Concepts

### Application Setup

```typescript
const application = FlexibleAppBuilder.instance
    .addEventSource(httpEventSource)    // HTTP server
    .addFramework(decoratorsFramework)  // Decorators for routing
    .createApp();
```

### Controller with Routes

```typescript
@Controller()
export class HelloController {
    @Route(HttpGet)
    public world(): any {
        return { message: "Hello, World!" };
    }
}
```

## Next Steps

- See [02-composable-security](../02-composable-security) for layered security
- See [03-winston-logger](../03-winston-logger) for production logging
