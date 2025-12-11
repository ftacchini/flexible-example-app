import "reflect-metadata";
import "jasmine";
import { createApplication } from "../../src/examples/01-simple-http/index";
import * as http from 'http';

const TEST_PORT = 3003;

async function fetchJson(url: string, method: string = 'GET', body?: any): Promise<any> {
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
                    resolve(json);
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

describe("Simple HTTP Example Integration Tests", () => {
    let app: any;

    beforeEach(async () => {
        app = createApplication(TEST_PORT);
    });

    afterEach(async () => {
        if (app) {
            await app.stop();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    });

    it("should start the application successfully", async () => {
        const result = await app.run();
        expect(result[0]).toEqual({ running: true });
    });

    it("should respond to GET /world endpoint", async () => {
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);

        expect(result.message).toBe("Hello, World!");
        expect(result.timestamp).toBeDefined();
    });

    it("should respond to POST /echo endpoint", async () => {
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        const testData = { name: "Alice", age: 30 };
        const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/echo`, 'POST', testData);

        expect(result.message).toBe("Echo response");
        expect(result.received).toEqual(testData);
        expect(result.timestamp).toBeDefined();
    });

    it("should handle multiple requests", async () => {
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        const result1 = await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        const result2 = await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);

        expect(result1.message).toBe("Hello, World!");
        expect(result2.message).toBe("Hello, World!");
        expect(result1.timestamp).not.toBe(result2.timestamp);
    });

    it("should stop the application successfully", async () => {
        await app.run();
        const result = await app.stop();
        expect(result[0]).toEqual({ running: false });
    });
});
