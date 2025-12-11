import { Controller, Route, BeforeExecution, Param } from "flexible-decorators";
import { Everything, FullEvent, FlexibleEvent, DelegateEventSource, FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject, injectable } from "tsyringe";
import { NEXT_LAYER } from "./index";
import { SecurityMiddleware } from "./security-middleware";

@injectable()
@Controller({ singleton: true })
export class SecurityController {
    constructor(
        @inject("NextLayer") private nextLayer: DelegateEventSource,
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {
        this.logger.info("[SecurityController] Constructor called");
    }

    @BeforeExecution(SecurityMiddleware, 'checkSecurity', { singleton: true })
    @Route(Everything)
    public async processAll(@Param(FullEvent) event: FlexibleEvent) {
        this.logger.info("[SecurityController] processAll START");

        // Forward to business layer
        this.logger.info("[SecurityController] Forwarding to business layer");
        const responses = await this.nextLayer.generateEvent(event);
        this.logger.info("[SecurityController] Received responses from business layer", { count: responses?.length });

        // Extract the first response value
        if (responses && responses.length > 0 && responses[0].responseStack.length > 0) {
            this.logger.info("[SecurityController] Returning response from business layer");
            return responses[0].responseStack[0];
        }

        this.logger.info("[SecurityController] No response from business layer");
        return { error: "No response from business layer" };
    }
}
