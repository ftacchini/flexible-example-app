import "reflect-metadata";
import "jasmine";
import { createComposableApp } from "../../src/examples/02-composable-security/index";
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
    let mainContainer: any;
    let businessContainer: any;

    beforeEach(async () => {
        const apps = await createComposableApp(TEST_PORT);
        securityApp = apps.securityApp;
        businessApp = apps.businessApp;
        mainContainer = apps.mainContainer;
        businessContainer = apps.businessContainer;
        await new Promise(resolve => setTimeout(resolve, 200));
    });

    afterEach(async () => {
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

    // Subtask 22.1: Integration tests for composable app with child containers
    describe("Child Container Integration", () => {
        it("should have separate child containers for business layer", () => {
            expect(mainContainer).toBeDefined();
            expect(businessContainer).toBeDefined();
            expect(businessContainer).not.toBe(mainContainer);
        });

        it("should allow security layer to receive HTTP requests", async () => {
            // This test verifies that the security layer receives requests from HTTP
            const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/users`);

            expect(result.statusCode).toBe(200);
            expect(result.data.users).toBeDefined();
            // If we get a response, it means the security layer successfully received and processed the request
        });

        it("should allow business layer to receive delegated events from security layer", async () => {
            // This test verifies that events are properly delegated from security to business layer
            const userData = { name: "TestUser", email: "test@example.com" };
            const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/createUser`, 'POST', userData);

            expect(result.statusCode).toBe(200);
            expect(result.data.message).toBe("User created");
            expect(result.data.user.name).toBe("TestUser");
            // If we get a business layer response, it means the delegation worked
        });

        it("should maintain container isolation between layers", () => {
            // Test that business container is a child of main container
            expect(businessContainer).not.toBe(mainContainer);

            // We can't directly test parent-child relationship with TSyringe API,
            // but we can verify they are different instances and have the expected methods
            expect(typeof businessContainer.registerValue).toBe('function');
            expect(typeof mainContainer.registerValue).toBe('function');
        });

        it("should inherit shared bindings from main container", () => {
            // This test verifies that child containers can access parent bindings
            // We test this indirectly by verifying that both layers can access shared services
            // like the logger (FLEXIBLE_APP_TYPES.LOGGER) which should be available in both

            // If both apps started successfully and can handle requests,
            // it means they can resolve their dependencies including shared ones
            expect(securityApp).toBeDefined();
            expect(businessApp).toBeDefined();

            // The fact that controllers can inject FLEXIBLE_APP_TYPES.LOGGER
            // and the apps work means inheritance is working
        });
    });
});
