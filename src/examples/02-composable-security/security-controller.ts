import { Controller, Route, BeforeExecution, Param } from "flexible-decorators";
import { Everything, FullEvent, FlexibleEvent, DelegateEventSource } from "flexible-core";
import { inject } from "inversify";
import { NEXT_LAYER } from "./index";
import { SecurityMiddleware } from "./security-middleware";

@Controller()
export class SecurityController {
    constructor(
        @inject(NEXT_LAYER) private nextLayer: DelegateEventSource
    ) {}

    @BeforeExecution(SecurityMiddleware, 'checkSecurity')
    @Route(Everything)
    public async processAll(@Param(FullEvent) event: FlexibleEvent) {
        // Forward to business layer
        const responses = await this.nextLayer.generateEvent(event);

        // Extract the first response value
        if (responses && responses.length > 0 && responses[0].responseStack.length > 0) {
            return responses[0].responseStack[0];
        }

        return { error: "No response from business layer" };
    }
}
