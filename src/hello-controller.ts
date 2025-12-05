import { Controller, Route } from "flexible-decorators";
import { HttpGet } from "flexible-http";

@Controller()
export class HelloController {

    @Route(HttpGet)
    public world(): any {
        return { some: "world" };
    }

}