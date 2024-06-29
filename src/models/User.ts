export interface User {
    username: string;
    password: string;
    oauth_provider_type: string;
    oauth_email:string;
    access_token: string;
    refresh_token: string;
    expires_in:Date
}

export interface UserCreate {
    username: string;
    password: string;
    oauth_provider_type?: string;
    oauth_email?:string;
    access_token?: string;
    refresh_token?: string;
    expires_in?:Date
}

export interface UserUpdate {
    username?: string;
    password?: string;
    oauth_provider_type?: string;
    oauth_email?:string;
    access_token?: string;
    refresh_token?: string;
    expires_in?:Date
}
