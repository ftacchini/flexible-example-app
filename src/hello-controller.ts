import { Controller, Route } from "flexible-decorators";
import { HttpGet, HttpMethod } from "flexible-http";

@Controller({ filter: HttpMethod })
export class HelloController {

    @Route(HttpGet)
    public world(): any {
        return { some: "world" };
    }

}