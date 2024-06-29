// src/strategies/OAuthStrategy.ts
export interface OAuthProvider {
    getAuthUrl(userId: string): string;
    getTokenFromCode(code: string): Promise<string>;
    getUserInfo(token: string): Promise<any>;
}
