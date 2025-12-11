import { Controller, Route, Param } from "flexible-decorators";
import { HttpGet, HttpPost, FromBody } from "flexible-http";
import { injectable } from "tsyringe";

@injectable()
@Controller()
export class HelloController {

    @Route(HttpGet)
    public world(): any {
        return {
            message: "Hello, World!",
            timestamp: new Date().toISOString()
        };
    }

    @Route(HttpPost)
    public echo(@Param(FromBody, { allBody: true }) body: any): any {
        return {
            message: "Echo response",
            received: body,
            timestamp: new Date().toISOString()
        };
    }
}
