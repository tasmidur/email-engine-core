import { MAIL_MESSAGE_INDEX } from "../utils/Constant";

export interface Message {
    messageId: string;
    userId: string;
    subject: string;
    bodyPreview: string;
    parentFolderId: string;
    conversationId: string;
    body: object;
    isRead: boolean;
    isDraft: boolean;
    messageType: string
    sender: object;
    receiver: object;
    createAt?: Date;
    updateAt?: Date;
}

export const MessageSchema={
    index:MAIL_MESSAGE_INDEX,
    body: {
        mappings: {
            properties: {
                messageId: { type: 'keyword' },
                userId:{ type: 'keyword' },
                subject: { type: 'text' },
                bodyPreview: { type: 'text' },
                parentFolderId: { type: 'keyword' },
                conversationId: { type: 'keyword' },
                body: { type: 'object' },
                isRead: { type: 'boolean' },
                isDraft: { type: 'boolean' },
                messageType: { type: 'keyword' },
                sender: { type: 'object' },
                receiver: { type: 'object' },
                createAt: { type: 'date' },
                updateAt: { type: 'date' },
            },
        },
    },
};