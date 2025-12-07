import "reflect-metadata";
import "jasmine";
import { createComposableApp } from "../../src/examples/02-composable-security/index";
import { HttpModuleBuilder } from "flexible-http";
import * as http from 'http';

const TEST_PORT = 3004;

async function fetchJson(url: string, method: string = 'GET', body?: any): Promise<{ data: any, statusCode: number }> {
    const urlObj = new URL(url);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ data: json, statusCode: res.statusCode || 200 });
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

describe("Composable Security Example Integration Tests", () => {
    let businessApp: any;
    let securityApp: any;

    beforeAll(async () => {
        HttpModuleBuilder.instance.reset();
        const apps = await createComposableApp(TEST_PORT);
        securityApp = apps.securityApp;
        businessApp = apps.businessApp;
        await new Promise(resolve => setTimeout(resolve, 200));
    });

    afterAll(async () => {
        try {
            if (securityApp) {
                await securityApp.stop();
            }
        } catch (e) {
            // Ignore stop errors
        }
        try {
            if (businessApp) {
                await businessApp.stop();
            }
        } catch (e) {
            // Ignore stop errors
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        HttpModuleBuilder.instance.reset();
    });

    it("should start both layers successfully", async () => {
        expect(businessApp).toBeDefined();
        expect(securityApp).toBeDefined();
    });

    it("should forward requests through security to business layer", async () => {
        const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/users`);

        expect(result.statusCode).toBe(200);
        expect(result.data.users).toBeDefined();
        expect(result.data.users.length).toBe(3);
        expect(result.data.users[0].name).toBe("Alice");
    });

    it("should handle POST requests through layers", async () => {
        const userData = { name: "David", email: "david@example.com" };
        const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/createUser`, 'POST', userData);

        expect(result.statusCode).toBe(200);
        expect(result.data.message).toBe("User created");
        expect(result.data.user.name).toBe("David");
        expect(result.data.user.email).toBe("david@example.com");
        expect(result.data.user.id).toBeDefined();
    });

    it("should return profile data", async () => {
        const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/profile`);

        expect(result.statusCode).toBe(200);
        expect(result.data.id).toBe(1);
        expect(result.data.name).toBe("Alice");
        expect(result.data.email).toBe("alice@example.com");
        expect(result.data.role).toBe("admin");
    });

    it("should handle multiple sequential requests", async () => {
        for (let i = 0; i < 3; i++) {
            const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/users`);
            expect(result.statusCode).toBe(200);
            expect(result.data.users).toBeDefined();
        }
    });

    it("should handle multiple different endpoints", async () => {
        const usersResult = await fetchJson(`http://127.0.0.1:${TEST_PORT}/users`);
        const profileResult = await fetchJson(`http://127.0.0.1:${TEST_PORT}/profile`);

        expect(usersResult.statusCode).toBe(200);
        expect(usersResult.data.users).toBeDefined();

        expect(profileResult.statusCode).toBe(200);
        expect(profileResult.data.name).toBe("Alice");
    });
});
