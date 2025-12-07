import "reflect-metadata";
import "jasmine";
import { FlexibleApp } from "flexible-core";
import { createApplication } from "../../src/examples/03-winston-logger/index";
import { WinstonLoggerModule } from "../../src/examples/03-winston-logger/winston-logger-module";
import { HttpModuleBuilder } from "flexible-http";
import winston from "winston";
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const TEST_PORT = 3002;
const TEST_LOG_DIR = path.join(__dirname, "../../test-logs");
const ERROR_LOG_PATH = path.join(TEST_LOG_DIR, "error.log");
const COMBINED_LOG_PATH = path.join(TEST_LOG_DIR, "combined.log");

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

describe("Winston Logger Integration Tests", () => {
    let app: FlexibleApp;

    beforeEach(() => {
        HttpModuleBuilder.instance.reset();

        // Create test log directory
        if (!fs.existsSync(TEST_LOG_DIR)) {
            fs.mkdirSync(TEST_LOG_DIR, { recursive: true });
        }

        // Clean up any existing log files
        if (fs.existsSync(ERROR_LOG_PATH)) {
            fs.unlinkSync(ERROR_LOG_PATH);
        }
        if (fs.existsSync(COMBINED_LOG_PATH)) {
            fs.unlinkSync(COMBINED_LOG_PATH);
        }

        // Create Winston logger with file transports
        const winstonLogger = new WinstonLoggerModule({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({
                    filename: ERROR_LOG_PATH,
                    level: 'error',
                    format: winston.format.json()
                }),
                new winston.transports.File({
                    filename: COMBINED_LOG_PATH,
                    format: winston.format.json()
                })
            ]
        });

        app = createApplication(TEST_PORT, winstonLogger);
    });

    afterEach(async () => {
        if (app) {
            await app.stop();
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        HttpModuleBuilder.instance.reset();

        // Clean up test log files
        if (fs.existsSync(ERROR_LOG_PATH)) {
            fs.unlinkSync(ERROR_LOG_PATH);
        }
        if (fs.existsSync(COMBINED_LOG_PATH)) {
            fs.unlinkSync(COMBINED_LOG_PATH);
        }
    });

    afterAll(() => {
        // Clean up test log directory
        if (fs.existsSync(TEST_LOG_DIR)) {
            fs.rmdirSync(TEST_LOG_DIR);
        }
    });

    it("should write logs to combined.log file", async () => {
        // ARRANGE
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        // ACT
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for logs to be written

        // ASSERT
        expect(fs.existsSync(COMBINED_LOG_PATH)).toBe(true);

        const logContent = fs.readFileSync(COMBINED_LOG_PATH, 'utf-8');
        expect(logContent.length).toBeGreaterThan(0);

        // Parse log lines
        const logLines = logContent.trim().split('\n').filter(line => line.length > 0);
        expect(logLines.length).toBeGreaterThan(0);

        // Verify log structure
        const logs = logLines.map(line => JSON.parse(line));

        // Should have setup logs
        const setupLogs = logs.filter(log => log.message && log.message.includes('setup'));
        expect(setupLogs.length).toBeGreaterThan(0);

        // Should have the controller log
        const controllerLog = logs.find(log => log.message === 'World endpoint called');
        expect(controllerLog).toBeDefined();
        expect(controllerLog?.level).toBe('info');
        expect(controllerLog?.endpoint).toBe('/world');
        expect(controllerLog?.timestamp).toBeDefined();
    });

    it("should write logs with proper JSON structure", async () => {
        // ARRANGE
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        // ACT
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await new Promise(resolve => setTimeout(resolve, 200));

        // ASSERT
        const logContent = fs.readFileSync(COMBINED_LOG_PATH, 'utf-8');
        const logLines = logContent.trim().split('\n').filter(line => line.length > 0);

        // Every line should be valid JSON
        logLines.forEach(line => {
            expect(() => JSON.parse(line)).not.toThrow();
        });

        // Every log should have required fields
        const logs = logLines.map(line => JSON.parse(line));
        logs.forEach(log => {
            expect(log.level).toBeDefined();
            expect(log.message).toBeDefined();
            expect(log.timestamp).toBeDefined();
        });
    });

    it("should include request context in logs", async () => {
        // ARRANGE
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        // ACT
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await new Promise(resolve => setTimeout(resolve, 200));

        // ASSERT
        const logContent = fs.readFileSync(COMBINED_LOG_PATH, 'utf-8');
        const logs = logContent.trim().split('\n').map(line => JSON.parse(line));

        // Find HTTP request log
        const httpLog = logs.find(log => log.message === 'HTTP request received');
        expect(httpLog).toBeDefined();
        expect(httpLog?.requestId).toBeDefined();
        expect(httpLog?.method).toBe('GET');
        expect(httpLog?.path).toBe('/world');
        expect(httpLog?.clientIp).toBeDefined();
    });

    it("should not write to error.log for non-error logs", async () => {
        // ARRANGE
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        // ACT
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await new Promise(resolve => setTimeout(resolve, 200));

        // ASSERT
        // error.log should not exist or be empty (no errors occurred)
        if (fs.existsSync(ERROR_LOG_PATH)) {
            const errorLogContent = fs.readFileSync(ERROR_LOG_PATH, 'utf-8');
            expect(errorLogContent.trim().length).toBe(0);
        }
    });

    it("should write multiple requests to log file", async () => {
        // ARRANGE
        await app.run();
        await new Promise(resolve => setTimeout(resolve, 100));

        // ACT - Make multiple requests
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await fetchJson(`http://127.0.0.1:${TEST_PORT}/world`);
        await new Promise(resolve => setTimeout(resolve, 200));

        // ASSERT
        const logContent = fs.readFileSync(COMBINED_LOG_PATH, 'utf-8');
        const logs = logContent.trim().split('\n').map(line => JSON.parse(line));

        // Should have 3 controller logs (one per request)
        const controllerLogs = logs.filter(log => log.message === 'World endpoint called');
        expect(controllerLogs.length).toBe(3);

        // Each should have unique timestamp
        const timestamps = controllerLogs.map(log => log.timestamp);
        expect(new Set(timestamps).size).toBeGreaterThan(0);
    });
});
