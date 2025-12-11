import { Controller, Route } from "flexible-decorators";
import { HttpGet } from "flexible-http";
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
