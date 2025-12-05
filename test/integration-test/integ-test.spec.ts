import "reflect-metadata";
import "jasmine";
import { FlexibleApp, FlexibleAppBuilder, SilentLoggerModule } from "flexible-core";
import { DecoratorsFrameworkModuleBuilder, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModuleBuilder } from "flexible-http";
import { HelloController } from "../../src/hello-controller";
import * as http from 'http';

const TEST_PORT = 3001;

async function fetchJson(url: string): Promise<any> {
    const urlObj = new URL(url);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
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

        req.end();
    });
}

// Helper function to create the app - same setup as index.ts but with configurable port and logger
function createApp(port: number): FlexibleApp {
    const httpEventSource = HttpModuleBuilder.instance
        .withPort(port)
        .build();

    const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([
            HelloController
        ]))
        .build();

    return FlexibleAppBuilder.instance
        .withLogger(new SilentLoggerModule())
        .addEventSource(httpEventSource)
        .addFramework(decoratorsFramework)
        .createApp();
}

describe("Flexible Example App Integration Tests", () => {

    let app: FlexibleApp;

    beforeEach(async () => {
        app = createApp(TEST_PORT);
    });

    afterEach(async () => {
        if (app) {
            await app.stop();
            // Give the port time to be released
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    });

    it("should start the application successfully", async () => {
        // ACT
        const result = await app.run();

        // ASSERT
        expect(result[0]).toEqual({ running: true });
    });

    it("should respond to GET /world endpoint", async () => {
        // ARRANGE
        const expected = { some: "world" };

        // ACT
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100)); // Give server time to fully initialize
        const result = await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);

        // ASSERT
        expect(result).toEqual(expected);
    });

    it("should stop the application successfully", async () => {
        // ARRANGE
        await app.run();

        // ACT
        const result = await app.stop();

        // ASSERT
        expect(result[0]).toEqual({ running: false });
    });
});
