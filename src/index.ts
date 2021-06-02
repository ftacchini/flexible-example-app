import "reflect-metadata";
import { FlexibleAppBuilder } from "flexible-core";
import { DecoratorsFrameworkModuleBuilder, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModuleBuilder } from "flexible-http";
import { HelloController } from "./hello-controller";

const httpEventSource = HttpModuleBuilder.instance
    .build();

const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([
        HelloController
    ]))
    .build();

const application = FlexibleAppBuilder.instance
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();

application.run().then(status => {
    console.log(JSON.stringify(status));
});