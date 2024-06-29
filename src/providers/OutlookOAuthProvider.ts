// src/strategies/OutlookOAuthStrategy.ts
import axios from 'axios';
import querystring from 'querystring';
import { OAuthProvider } from './OAuthProvider';
import { ElasticSearchClient } from '../ElasticSearchClient';
import { UserService } from '../services/UserService';
import { log } from 'console';
import { Response } from 'express';

export class OutlookOAuthProvider implements OAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private authorizationBaseUrl: string;
    private tokenUrl: string;
    private scope: string;
    private elasticSearchClient: ElasticSearchClient;
    private userService: UserService;
    
    constructor() {
        this.clientId = process.env.OUTLOOK_CLIENT_ID
        this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET
        this.redirectUri = 'http://localhost:3000/auth/outlook/callback';
        this.authorizationBaseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
        this.tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        this.scope = 'openid profile email offline_access https://graph.microsoft.com/Mail.Read';
        this.elasticSearchClient = new ElasticSearchClient();
        this.userService = new UserService();
    }
    
    getAuthUrl(userId: string): string {
        return `${this.authorizationBaseUrl}?${querystring.stringify({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            response_mode: 'query',
            scope: this.scope,
            state: userId
        })}`;
    }

    async getTokenFromCode(code: string): Promise<any> {
        const tokenData = querystring.stringify({
            client_id: this.clientId,
            scope: this.scope,
            code,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
            client_secret: this.clientSecret
        });

        const response = await axios.post(this.tokenUrl, tokenData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        //console.log(response.data);
        
        return response.data;
    }

    async getUserInfo(accessToken: string): Promise<any> {
        const graphUrl = 'https://graph.microsoft.com/v1.0/me';
        const response = await axios.get(graphUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }

    async getUserMail(accessToken: string): Promise<any> {
        const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }

    async subscribeToOutlookWebhook(accessToken: string) {
        try {
            // Get access token using client credentials flow
            // Create subscription payload
            const subscriptionPayload = {
                changeType: 'created,updated,deleted',
                notificationUrl: `https://bc42-160-238-33-8.ngrok-free.app/auth/webhook`,
                resource: '/me/mailFolders(\'inbox\')/messages',
                expirationDateTime: new Date(Date.now() + 86400000).toISOString(), // Subscription expiration (24 hours)
                clientState: "secretClientValue",
                latestSupportedTlsVersion: "v1_2"
            };
    
            // Send POST request to Graph API to create subscription
            const response = await axios.post(`https://graph.microsoft.com/v1.0/subscriptions`, subscriptionPayload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Subscription created:', response.data);
            return response.data
        } catch (error) {
            console.error('Error creating subscription:', error);
            return error;
            
        }
    }

    async saveMessagesToElasticsearch(messages: any): Promise<void> {
        console.log("messages",messages);
        
        for (const message of messages.value) {
            await this.elasticSearchClient.saveMessage('outlook-messages', message);
        }
    }
}
