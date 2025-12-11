import "reflect-metadata";
import {
    FlexibleApp,
    DelegateEventSource
} from "flexible-core";
import {
    DecoratorsFrameworkModule,
    ExplicitControllerLoader
} from "flexible-decorators";
import { HttpModule } from "flexible-http";
import { FlexibleContainer } from "flexible-core";
import { BusinessController } from "./business-controller";
import { SecurityController } from "./security-controller";

export const NEXT_LAYER = "NextLayer";

export async function createComposableApp(port?: number) {

    const httpPort = port || parseInt(process.env.PORT || "3000", 10);

    // ============================================
    // Main Container (Shared Bindings)
    // ============================================
    const mainContainer = new FlexibleContainer();
    const businessEventSource = new DelegateEventSource();

    // Create HTTP module for security layer (starts the HTTP server)
    const httpModule = HttpModule.builder().withPort(httpPort).build();

    // ============================================
    // Layer 1: Security (Outer Layer - Entry Point)
    // ============================================

    // Register NEXT_LAYER in the main container so it's available to all child containers
    mainContainer.registerValue("NextLayer", businessEventSource);

    const securityFramework = DecoratorsFrameworkModule.builder()
        .withControllerLoader(new ExplicitControllerLoader([
            SecurityController
        ]))
        .build();

    // Security app uses HTTP module as event source (starts the HTTP server)
    const securityApp = FlexibleApp.builder()
        .addModule(httpModule)  // Share container bindings
        .addEventSource(httpModule)  // Start HTTP server
        .addFramework(securityFramework)
        .withContainer(mainContainer)
        .createApp();

    await securityApp.run();

    // ============================================
    // Layer 2: Business Logic (Inner Layer)
    // ============================================

    // Create business layer child container
    const businessContainer = mainContainer.createChild();

    // Wrap DelegateEventSource in a module
    const businessEventSourceModule = {
        getInstance: () => businessEventSource,
        register: () => {}, // Empty register method for FlexibleModule interface
        registerIsolated: () => {} // Empty registerIsolated method for FlexibleEventSourceModule interface
    };

    const businessFramework = DecoratorsFrameworkModule.builder()
        .withControllerLoader(new ExplicitControllerLoader([
            BusinessController
        ]))
        .build();

    // Business app uses DelegateEventSource and needs HttpModule for extractors
    const businessApp = FlexibleApp.builder()
        .addEventSource(businessEventSourceModule)
        .addFramework(businessFramework)
        .withContainer(businessContainer)
        .createApp();

    await businessApp.run();

    return { securityApp, businessApp, mainContainer, businessContainer };
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
