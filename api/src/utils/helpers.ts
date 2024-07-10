export function responseMessage(status: number, message: string, data?: any) {
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

export function chunkArray(array: any[], size: number): any[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function isExpire(tokenExpires: string): boolean {
    const expirationDate = new Date(tokenExpires);
    const now = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in milliseconds
    return now >= expirationDate;
}

export function formatedExpireTime(time: any) {
    return new Date(
        Date.now() +
        (parseInt(time) - 300) * 1000
    );
}

