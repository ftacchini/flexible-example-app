import { Controller, Route, Param } from "flexible-decorators";
import { HttpGet, HttpPost, FromBody } from "flexible-http";

@Controller()
export class BusinessController {

    @Route(HttpGet)
    public users(): any {
        console.log("[Business] Fetching users");
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
        console.log("[Business] Creating user:", body);
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
        console.log("[Business] Fetching profile");
        return {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            role: "admin"
        };
    }
}
