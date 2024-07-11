import {IOAuthProvider} from "./IOAuthProvider";

/**
 * OAuthContext provides a centralized interface for working with OAuth providers.
 */
export class OAuthContext {
    /**
     * The underlying OAuth provider strategy
     */
    private strategy: IOAuthProvider;

    /**
     * Constructor
     * @param {IOAuthProvider} strategy The OAuth provider strategy
     */
    constructor(strategy: IOAuthProvider) {
        this.strategy = strategy;
    }

    /**
     * Sets the OAuth provider strategy
     * @param {IOAuthProvider} strategy The new OAuth provider strategy
     */
    setStrategy(strategy: IOAuthProvider) {
        this.strategy = strategy;
    }

    /**
     * Gets the authorization URL for the given user ID
     * @param {string} userId The user ID
     * @returns {string} The authorization URL
     */
    getAuthUrl(userId: string): string {
        return this.strategy.getAuthUrl(userId);
    }

    /**
     * Refreshes the access token for the given refresh token
     * @param {string} refreshToken The refresh token
     * @returns {Promise<any>} The refreshed access token
     */
    async refreshAccessToken(refreshToken: string): Promise<any> {
        return this.strategy.refreshAccessToken(refreshToken);
    }

    /**
     * Handles the callback response from the authorization server
     * @param {string} code The authorization code
     * @param {string} userId The user ID
     * @returns {Promise<any>} The accessed token and user data
     */
    async handleCallback(code: string, userId: string): Promise<any> {
        return this.strategy.handleCallback(code, userId);
    }

    /**
     * Handles notification callback values from the notification server
     * @param {any[]} values The notification callback values
     * @returns {Promise<any>} The processed notification values
     */
    async handleNotificationCallback(values: any[]): Promise<any> {
        return this.strategy.handleNotificationCallback(values);
    }

    /**
     * Renew a subscription for a user for notification purposes
     * @param {string} accessToken The access token
     * @param {string} subscriptionId The subscription ID
     * @returns {Promise<any>} The renewed subscription data
     */
    async renewSubscriptionForNotification(accessToken: string, subscriptionId: string): Promise<any> {
        return this.strategy.renewSubscriptionForNotification(accessToken, subscriptionId);
    }

    /**
     * Retrieves a subscription for a user for notification purposes
     * @param {string} accessToken The access token
     * @param {string} userId The user ID
     * @returns {Promise<any>} The subscription data
     */
    async subscriptionForNotification(accessToken: string, userId: string): Promise<any> {
        return this.strategy.subscriptionForNotification(accessToken, userId);
    }

    /**
     * Syncs all messages for a user from the notification server
     * @param {string} accessToken The access token
     * @param {string} userId The user ID
     * @returns {Promise<any>} The synced messages data
     */
    async syncAllMessages(accessToken: string, userId: string): Promise<any> {
        return this.strategy.syncAllMessages(accessToken, userId);
    }
}