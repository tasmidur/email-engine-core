export interface IOAuthProvider {
    getAuthUrl(userId: string): string;

    getTokenFromCode(code: string): Promise<any>;

    refreshAccessToken(refreshToken: string): Promise<any>;

    handleCallback(code: string, userId: string): Promise<any>;

    handleNotificationCallback(values: any[]): Promise<any>;

    renewSubscription(accessToken: string, subscriptionId: string): Promise<any>;
}

