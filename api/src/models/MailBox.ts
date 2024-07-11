import {MAILBOX_INDEX} from "../utils/constant";

export interface MailBox {
    userId: string;
    emailAddress: string;
    displayName: string;
    totalMessages?: number;
    unreadMessages?: number;
    createAt?: Date;
    updateAt?: Date;
}

export const MailBoxSchema = {
    index: MAILBOX_INDEX,
    body: {
        settings: {
                number_of_shards: 1,    // Adjust the number of primary shards
                number_of_replicas: 1   // Adjust the number of replica shards
        },
        mappings: {
            properties: {
                userId: {type: "keyword"},
                emailAddress: {type: "keyword"},
                displayName: {type: "text"},
                totalMessages: {type: "integer"},
                unreadMessages: {type: "integer"},
                createAt: {type: "date"},
                updateAt: {type: "date"},
            },
        },
    },
};
