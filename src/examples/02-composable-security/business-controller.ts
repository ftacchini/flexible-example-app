import { Controller, Route, Param } from "flexible-decorators";
import { HttpGet, HttpPost, FromBody } from "flexible-http";
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject, injectable } from "tsyringe";

@injectable()
@Controller()
export class BusinessController {

    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {
        this.logger.info("[BusinessController] Constructor called");
    }

    @Route(HttpGet)
    public users(): any {
        this.logger.info("[BusinessController] users() START");
        this.logger.info("[Business] Fetching users");
        return {
            users: [
                { id: 1, name: "Alice" },
                { id: 2, name: "Bob" },
                { id: 3, name: "Charlie" }
            ]
        };
    }

    @Route(HttpPost)
    public createUser(@Param(FromBody, { allBody: true }) body: any): any {
        this.logger.info("[BusinessController] createUser() START");
        this.logger.info("[Business] Creating user:", body);
        return {
            message: "User created",
            user: {
                id: Math.floor(Math.random() * 1000),
                ...body
            }
        };
    }

    @Route(HttpGet)
    public profile(): any {
        this.logger.info("[BusinessController] profile() START");
        this.logger.info("[Business] Fetching profile");
        return {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            role: "admin"
        };
    }
}
