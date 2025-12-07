import "reflect-metadata";
import {
    FlexibleAppBuilder,
    DelegateEventSource
} from "flexible-core";
import {
    DecoratorsFrameworkModuleBuilder,
    ExplicitControllerLoader
} from "flexible-decorators";
import { HttpModuleBuilder } from "flexible-http";
import { ContainerModule } from "inversify";
import { BusinessController } from "./business-controller";
import { SecurityController } from "./security-controller";

export const NEXT_LAYER = Symbol("NextLayer");

export async function createComposableApp(port?: number) {
    const httpPort = port || parseInt(process.env.PORT || "3000", 10);

    // Create HTTP module - this provides filters/extractors like HttpGet, HttpPost, FromBody
    const httpModule = HttpModuleBuilder.instance.withPort(httpPort).build();

    // ============================================
    // Layer 2: Business Logic (Inner Layer)
    // ============================================
    const businessEventSource = new DelegateEventSource();

    // Wrap DelegateEventSource in a module
    const businessEventSourceModule = {
        getInstance: () => businessEventSource,
        container: new ContainerModule(() => {}),
        isolatedContainer: new ContainerModule(() => {})
    };

    const businessFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([
            BusinessController
        ]))
        .build();

    // Business app uses DelegateEventSource and shares HTTP module's container for filters/extractors
    const businessApp = FlexibleApp.builder()
        .addModule(httpModule)  // Add as module to get container bindings (filters/extractors)
        .addEventSource(businessEventSourceModule)
        .addFramework(businessFramework)
        .createApp();

    await businessApp.run();

    // ============================================
    // Layer 1: Security (Outer Layer - Entry Point)
    // ============================================

    // Module that binds the business layer's event source
    const securityModule = {
        container: new ContainerModule(({ bind }) => {
            bind(NEXT_LAYER).toConstantValue(businessEventSource);
        })
    };

    const securityFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([
            SecurityController
        ]))
        .build();

    // Security app uses HTTP module as event source (starts the HTTP server)
    const securityApp = FlexibleApp.builder()
        .addModule(securityModule)
        .addModule(httpModule)  // Share container bindings
        .addEventSource(httpModule)  // Start HTTP server
        .addFramework(securityFramework)
        .createApp();

    await securityApp.run();

    return { securityApp, businessApp };
}

// Only run if this is the main module
if (require.main === module) {
    const port = parseInt(process.env.PORT || "3000", 10);
    createComposableApp(port).then(() => {
        console.log(`Composable security app running on http://localhost:${port}`);
        console.log("Architecture: HTTP → Security Layer → Business Logic");
        console.log("Security layer logs all requests");
        console.log("\nTry:");
        console.log(`  curl http://localhost:${port}/users`);
        console.log(`  curl http://localhost:${port}/profile`);
        console.log(`  curl -X POST http://localhost:${port}/createUser -H "Content-Type: application/json" -d '{"name":"Dave"}'`);
    });
}
