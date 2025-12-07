import { injectable } from 'inversify';
import { FlexibleEvent, FullEvent } from 'flexible-core';
import { Param } from 'flexible-decorators';

/**
 * Simple security middleware that logs requests.
 *
 * In a real application, this could perform authentication,
 * authorization, input validation, etc.
 */
@injectable()
export class SecurityMiddleware {
    private requestCount = 0;

    public async checkSecurity(@Param(FullEvent) event: FlexibleEvent): Promise<void> {
        this.requestCount++;
        const httpEvent = event as any;

        console.log(`[Security] Request #${this.requestCount}: ${httpEvent.routeData?.method || 'unknown'} ${httpEvent.routeData?.route || 'unknown'}`);

        // Security checks would go here
        // For now, just allow all requests
    }
}
