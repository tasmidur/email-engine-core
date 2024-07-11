/**
 * IOAuthProvider interface defines the methods required for an OAuth provider.
 */
export interface IOAuthProvider {
    /**
     * Generates the authorization URL for the given user ID.
     *
     * @param {string} userId - The ID of the user.
     * @returns {string} The authorization URL.
     */
    getAuthUrl(userId: string): string;

    /**
     * Retrieves tokens using an authorization code.
     *
     * @param {string} code - The authorization code.
     * @returns {Promise<any>} A promise that resolves with the tokens.
     */
    getTokenFromCode(code: string): Promise<any>;

    /**
     * Refreshes the access token using a refresh token.
     *
     * @param {string} refreshToken - The refresh token.
     * @returns {Promise<any>} A promise that resolves with the new tokens.
     */
    refreshAccessToken(refreshToken: string): Promise<any>;

    /**
     * Handles the callback after authorization and retrieves tokens.
     *
     * @param {string} code - The authorization code.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<any>} A promise that resolves with the tokens.
     */
    handleCallback(code: string, userId: string): Promise<any>;

    /**
     * Handles the notification callback from the provider.
     *
     * @param {any[]} values - The notification values.
     * @returns {Promise<any>} A promise that resolves when the notification is handled.
     */
    handleNotificationCallback(values: any[]): Promise<any>;

    /**
     * Subscribes to notifications for the user.
     *
     * @param {string} accessToken - The access token of the user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<any>} A promise that resolves with the subscription details.
     */
    subscriptionForNotification(accessToken: string, userId: string): Promise<any>;

    /**
     * Renews the notification subscription for the user.
     *
     * @param {string} accessToken - The access token of the user.
     * @param {string} subscriptionId - The ID of the subscription.
     * @returns {Promise<any>} A promise that resolves with the renewed subscription details.
     */
    renewSubscriptionForNotification(accessToken: string, subscriptionId: string): Promise<any>;

    /**
     * Synchronizes all messages for the user.
     *
     * @param {string} accessToken - The access token of the user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<any>} A promise that resolves when the synchronization is complete.
     */
    syncAllMessages(accessToken: string, userId: string): Promise<any>;
}


