import {MAIL_MESSAGE_INDEX} from "../utils/constant";

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
    isFlagged: boolean,
    messageType: string
    sender: object;
    receiver: object;
    createAt?: Date;
    updateAt?: Date;
}

export const MessageSchema = {
    index: MAIL_MESSAGE_INDEX,
    body: {
        settings: {
                number_of_shards: 5,    // Adjust the number of primary shards
                number_of_replicas: 1   // Adjust the number of replica shards
        },
        mappings: {
            properties: {
                messageId: {type: 'keyword'},
                userId: {type: 'keyword'},
                subject: {type: 'text'},
                bodyPreview: {type: 'text'},
                parentFolderId: {type: 'keyword'},
                conversationId: {type: 'keyword'},
                body: {type: 'object'},
                isRead: {type: 'boolean'},
                isDraft: {type: 'boolean'},
                isFlagged: {type: 'boolean'},
                messageType: {type: 'keyword'},
                sender: {type: 'object'},
                receiver: {type: 'object'},
                createAt: {type: 'date'},
                updateAt: {type: 'date'},
            },
        },
    },
};