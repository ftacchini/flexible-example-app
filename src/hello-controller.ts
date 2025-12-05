import { Controller, Route } from "flexible-decorators";
import { HttpGet } from "flexible-http";

@Controller()
export class HelloController {

    @Route(HttpGet, { path: "/world" })
    public world(): any {
        return { some: "world" };
    }

}