import "reflect-metadata";
import { FlexibleApp, FlexibleAppBuilder } from "flexible-core";
import { DecoratorsFrameworkModuleBuilder, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModuleBuilder } from "flexible-http";
import { HelloController } from "./hello-controller";

export function createApplication(port?: number): FlexibleApp {
    const httpPort = port || parseInt(process.env.PORT || "3000", 10);

    const httpEventSource = HttpModuleBuilder.instance
        .withPort(httpPort)
        .build();

    const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([
            HelloController
        ]))
        .build();

    return FlexibleApp.builder()
        .addEventSource(httpEventSource)
        .addFramework(decoratorsFramework)
        .createApp();
}

// Only run if this is the main module
if (require.main === module) {
    const application = createApplication();
    application.run().then(status => {
        const port = parseInt(process.env.PORT || "3000", 10);
        console.log(`Server running on http://localhost:${port}`);
        console.log("Application status:", JSON.stringify(status));
    });
}
