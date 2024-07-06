import { PROVIDER_TYPE_OUTLOOK } from "./Constant";
import { OutlookOAuthProvider } from '../providers/OutlookOAuthProvider';

export function responseMessage(status: number, message: string, data?: any) {
    let messageData = data||{};
    if (Object.keys(messageData).length > 0 && messageData?._id){
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

