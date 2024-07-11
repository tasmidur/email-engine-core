/**
 * Returns a response message object with a status, message, and optional data.
 *
 * @param {number} status - The HTTP status code for the response.
 * @param {string} message - The response message.
 * @param {any} [data] - Optional data to be included in the response.
 * @returns {{ status: number, message: string, data: any }}
 */
export function responseMessage(status: number, message: string, data?: any): { status: number; message: string; data: any; } {
    let messageData = data || {};
    if (Object.keys(messageData).length > 0 && messageData?._id) {
        messageData = {
            id: data?._id,
            ...(messageData?._source ? messageData?._source : {})
        }
    }
    return {
        status,
        message,
        data: messageData
    }
}

/**
 * Checks if a token has expired based on its expiration date.
 *
 * @param {string} tokenExpires - The expiration date of the token in string format.
 * @returns {boolean} True if the token has expired, false otherwise.
 */
export function isExpire(tokenExpires: string): boolean {
    const expirationDate = new Date(tokenExpires);
    const now = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in milliseconds
    return now >= expirationDate;
}

/**
 * Formats an expiration time by subtracting 5 minutes from the provided time.
 *
 * @param {any} time - The time to be formatted.
 * @returns {Date} The formatted expiration time.
 */
export function formatedExpireTime(time: any): Date {
    return new Date(
        Date.now() +
        (parseInt(time) - 300) * 1000
    );
}