# Composable Security Example

This example demonstrates how to build composable applications using Flexible's layered architecture pattern.

## Architecture

```
HTTP Request → Security Layer → Business Layer
               (logs requests)   (handles logic)
```

The application consists of two separate FlexibleApp instances:

1. **Security Layer** (outer) - Entry point that receives HTTP requests
2. **Business Layer** (inner) - Contains the actual business logic

## Key Concepts

### Shared Container

Both apps share the same HTTP module instance, which means they share the main application container. This is **critical** because:

- HTTP filters (`HttpGet`, `HttpPost`, etc.) are registered in the HTTP module's container
- HTTP extractors (`FromBody`, `FromQuery`, etc.) are also in that container
- Both layers need access to these filters/extractors for routing and data extraction

```typescript
const httpModule = HttpModuleBuilder.instance.withPort(port).build();

// Both apps use the SAME httpModule instance
const businessApp = FlexibleAppBuilder.instance
    .addEventSource(httpModule)  // Shares container
    .createApp();

const securityApp = FlexibleAppBuilder.instance
    .addEventSource(httpModule)  // Same instance - shares container
    .createApp();
```

### DelegateEventSource

The business layer uses `DelegateEventSource`, which allows it to be triggered programmatically:

```typescript
const businessEventSource = new DelegateEventSource();

// Security layer forwards events to business layer
const responses = await businessEventSource.generateEvent(event);
```

### Everything Filter

The security controller uses the `Everything` filter to match all incoming events:

```typescript
@Route(Everything)
public async processAll(@Param(FullEvent) event: FlexibleEvent) {
    // This matches ALL events and forwards them
    return await this.nextLayer.generateEvent(event);
}
```

## Running the Example

```bash
npm start

# In another terminal:
curl http://localhost:3000/users
curl http://localhost:3000/profile
curl -X POST http://localhost:3000/createUser -H "Content-Type: application/json" -d '{"name":"Dave"}'
```

## What You'll See

```
[Security] Request #1: GET /users
[Business] Fetching users

[Security] Request #2: GET /profile
[Business] Fetching profile

[Security] Request #3: POST /createUser
[Business] Creating user: { name: 'Dave' }
```

## How It Works

1. HTTP request arrives at the security layer
2. Security middleware logs the request
3. Security controller forwards the event to the business layer
4. Business layer processes the request using its controllers
5. Response flows back through the layers

## Extending This Example

You could add more layers:

```
HTTP → Rate Limit → Auth → Security → Business
```

Each layer would:
1. Use `DelegateEventSource` (except the outermost)
2. Share the same HTTP module for filters/extractors
3. Forward events to the next layer using `@Route(Everything)`

## See Also

- [Composable Apps Guide](../../../../../flexible-core/docs/guides/composable-apps.md)
- [DelegateEventSource Documentation](../../../../../flexible-core/docs/api/delegate-event-source.md)
