import {USER_INDEX} from "../utils/constant";

export interface User {
    username: string;
    password: string;
    providerType: "outlook" | "gmail" | "yahoo" | "hotmail" | "other";
    emailAddress: string;
    displayName: string;
    identityKey: string; // mail id
    accessToken: string;
    refreshToken: string;
    expireIn: Date;
    notificationSubscriptionId: string,
    notificationSubscriptionExpirationDateTime: Date,
    notificationCallBackUrl: string,
    createAt: Date;
    updateAt: Date;
}

export interface UserCreate extends Partial<User> {
    username: string;
    password: string;
    createAt: Date;
}

export interface UserUpdate extends Partial<User> {
    providerType: "outlook" | "gmail" | "yahoo" | "hotmail" | "other";
    emailAddress?: string;
    displayName?: string;
    identityKey?: string; // mail id
    accessToken?: string;
    refreshToken?: string;
    expireIn?: Date;
    updateAt: Date;
}

export interface JwtTokenPayload {
    id: string;
    username: string;
    provider?: string
}

export const UserSchema = {
    index: USER_INDEX,
    body: {
        settings: {
                number_of_shards: 2,    // Adjust the number of primary shards
                number_of_replicas: 1   // Adjust the number of replica shards
        },
        mappings: {
            properties: {
                username: {type: "keyword"},
                password: {type: "text"},
                providerType: {type: "keyword"},
                emailAddress: {type: "keyword"},
                displayName: {type: "text"},
                identityKey: {type: "keyword"},
                accessToken: {type: "text"},
                refreshToken: {type: "text"},
                expireIn: {type: "date"},
                notificationSubscriptionId: {type: "keyword"},
                notificationSubscriptionExpirationDateTime: {type: "date"},
                createAt: {type: "date"},
                updateAt: {type: "date"},
            },
        },
    },
};
