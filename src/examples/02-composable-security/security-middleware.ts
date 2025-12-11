import { injectable } from 'tsyringe';

/**
 * Simple security middleware that logs requests.
 *
 * In a real application, this could perform authentication,
 * authorization, input validation, etc.
 */
@injectable()
export class SecurityMiddleware {
    private requestCount = 0;

    public async checkSecurity(): Promise<void> {
        this.requestCount++;
        console.log(`[Security] Request #${this.requestCount} received`);

        // Security checks would go here
        // For now, just allow all requests
    }
}
