export interface User {
    username: string;
    password: string;
    providerType: "outlook" | "gmail" | "yahoo" | "hotmail" | "other"
    emailAddress: string;
    displayName: string;
    identityKey: string;  // mail id
    accessToken: string;
    refreshToken: string;
    expireIn: Date
    createAt: Date;
    updateAt: Date;
}

export interface Mailbox {
    userId: string;
    emailAddress: string;
    displayName: string,
    totalMessages?: number
    unreadMessages?: number
    createAt?: Date;
    updateAt?: Date;
}

export interface UserCreate extends Partial<User>{
    username: string;
    password: string;
    createAt: Date;
}

export interface UserUpdate extends Partial<User>{
    providerType: "outlook" | "gmail" | "yahoo" | "hotmail" | "other"
    emailAddress?: string;
    displayName?: string;
    identityKey?: string;  // mail id
    accessToken?: string;
    refreshToken?: string;
    expireIn?: Date;
    updateAt: Date;
}
