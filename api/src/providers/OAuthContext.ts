import {IOAuthProvider} from "./IOAuthProvider";

export class OAuthContext {
    private strategy: IOAuthProvider;

    constructor(strategy: IOAuthProvider) {
        this.strategy = strategy;
    }

    setStrategy(strategy: IOAuthProvider) {
        this.strategy = strategy;
    }

    getAuthUrl(userId: string): string {
        return this.strategy.getAuthUrl(userId);
    }

    async refreshAccessToken(refreshToken: string): Promise<any> {
        return this.strategy.refreshAccessToken(refreshToken);
    }

    async handleCallback(code: string, userId: string): Promise<any> {
        return this.strategy.handleCallback(code, userId);
    }

    async handleNotificationCallback(values: any[]): Promise<any> {
        return this.strategy.handleNotificationCallback(values);
    }

    async renewSubscription(accessToken: string, subscriptionId: string): Promise<any> {
        return this.strategy.renewSubscription(accessToken, subscriptionId);
    }

}
