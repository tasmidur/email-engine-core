export function responseMessage(status: number, message: string, data?: any) {
    let messageData = {};
    if (Object.keys(data).length > 0){
        messageData = {
            id: data?._id,
            ...(data?._source ? data?._source : {})
        }
    }
    return {
        status,
        message,
        data: messageData
    }
}