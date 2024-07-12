import axios from "axios";
import querystring from "querystring";
import {IOAuthProvider} from "./IOAuthProvider";
import {MESSAGE_TYPE_FORWARD, MESSAGE_TYPE_NEW, MESSAGE_TYPE_REPLY, PROVIDER_TYPE_OUTLOOK,} from "../utils/constant";
import {MessageService} from "../services/MessageService";
import {UserService} from "../services/UserService";
import {responseMessage} from "../utils/helpers";
import {UserUpdate} from "../models/User";
import {MailBoxService} from "../services/MailBoxService";
import {publishMessage} from "../socketClient";
import { encrypt } from '../crypto';

export class OutlookOAuthProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private authorizationBaseUrl: string;
    private tokenUrl: string;
    private scope: string;
    private messageService: MessageService;
    private userService: UserService;
    private mailBoxService: MailBoxService;

    constructor() {
        this.clientId = process.env.OUTLOOK_CLIENT_ID || "";
        this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || "";
        this.redirectUri = process.env.OUTLOOK_REDIRCT_URL || "";
        this.authorizationBaseUrl =
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
        this.tokenUrl =
            "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        this.scope =
            "openid profile email offline_access https://graph.microsoft.com/Mail.Read";
        this.messageService = new MessageService();
        this.userService = new UserService();
        this.mailBoxService = new MailBoxService();
    }

    getAuthUrl(userId: string): string {
        return `${this.authorizationBaseUrl}?${querystring.stringify({
            client_id: this.clientId,
            response_type: "code",
            redirect_uri: this.redirectUri,
            response_mode: "query",
            scope: this.scope,
            state: userId,
        })}`;
    }

    async getTokenFromCode(code: string): Promise<any> {
        try {
            const tokenData = querystring.stringify({
                client_id: this.clientId,
                scope: this.scope,
                code,
                redirect_uri: this.redirectUri,
                grant_type: "authorization_code",
                client_secret: this.clientSecret,
            });

            const response = await axios.post(this.tokenUrl, tokenData, {
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
            });
            return responseMessage(200, "Successfully fetch tokens", response.data);
        } catch (error: any) {
            console.log("Error:getTokenFromCode", error?.response?.data);
            throw new Error(`Error:getTokenFromCode`);
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<any> {
        try {
            const response = await axios.post(this.tokenUrl, querystring.stringify({
                refresh_token: refreshToken,
                grant_type: "refresh_token",
                client_id: this.clientId,
                scope: this.scope,
                client_secret: this.clientSecret,
            }));
            return response.data;
        } catch (error: any) {
            console.log("Error:refreshAccessToken", error?.response?.data);
            throw new Error(`Error:refreshAccessToken`);
        }
    }

    async handleCallback(code: string, userId: string): Promise<any> {
        try {
            const {
                data: {access_token, refresh_token, expires_in},
            } = await this.getTokenFromCode(code);

            const {data: userData} = await this.getUserInfo(access_token);

            const tokenExpires = new Date(
                Date.now() + (parseInt(expires_in) - 300) * 1000
            );

            let userPayload: UserUpdate = {
                providerType: PROVIDER_TYPE_OUTLOOK,
                emailAddress: userData.mail,
                displayName: userData.displayName,
                identityKey: userData.id,
                accessToken: access_token || "",
                refreshToken: refresh_token || "",
                expireIn: tokenExpires || new Date(),
                updateAt: new Date(),
            };

            /**
             * toSubscribe to OutlookWebhook for real time mail change notifications
             */
            const subscriptionCreate = await this.subscriptionForNotification(
                access_token,
                userId
            );
            console.log("subscriptionCreate", subscriptionCreate)
            if (subscriptionCreate?.id) {
                const subscriptionExpires = new Date(
                    Date.now() +
                    (parseInt(subscriptionCreate?.expirationDateTime) - 300) * 1000
                );
                userPayload = {
                    ...userPayload,
                    notificationSubscriptionId: subscriptionCreate?.id,
                    notificationSubscriptionExpirationDateTime: subscriptionExpires,
                    notificationCallBackUrl: subscriptionCreate?.notificationUrl
                };
            }

            /**
             * updateUser details
             */
            const updatedUser = await this.userService.updateUser(userId, userPayload);

            /**
             * syncAllMessages by access token
             */
            const allMessageSync=await this.syncAllMessages(access_token, userId);

            return responseMessage(200, "Outlook account linked successfully", {
                user: updatedUser?.data,
                allMessageSync
            });
        } catch (error: any) {
            console.log("Error:handleOutlookCallback", error?.response?.data)
            throw new Error(`Error:handleOutlookCallback`);
        }
    }

    async handleNotificationCallback(values: any[]): Promise<any> {
        for (const notification of values) {
            let userId = notification?.clientState;
            if (userId) {
                let user: any = await this.userService.getUserById(userId);
                if (user?.data?.notificationSubscriptionId === notification?.subscriptionId) {
                    this.syncAllMessages(user?.data?.accessToken, userId).then(res => {
                        console.log("sync message......")
                        publishMessage(userId, {message: "sync message......"})
                    })
                }
            }
        }
    }

    async subscriptionForNotification(accessToken: string, userId: string): Promise<any> {
        try {
            const subscriptionPayload = {
                changeType: "created,updated,deleted",
                notificationUrl: `${process.env.NOTIFICATION_HANDLER_URL}`,
                resource: `/me/mailFolders/inbox/messages`,
                expirationDateTime: new Date(
                    new Date().getTime() + 3600 * 1000
                ).toISOString(), // 1 hour from now
                clientState: userId,
            };

            const response = await axios.post(
                `https://graph.microsoft.com/v1.0/subscriptions`,
                subscriptionPayload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            console.log("Error:toSubscribe:", error?.response?.data);
            //throw new Error(`Error:toSubscribe`);
        }
    }

    async renewSubscriptionForNotification(accessToken: string, subscriptionId: string): Promise<any> {
        console.log("\nsub", accessToken, subscriptionId)
        try {
            const subscriptionPayload = {
                expirationDateTime: new Date(
                    new Date().getTime() + 3600 * 1000
                ).toISOString(), // 1 hour from now
            };

            const response = await axios.patch(
                `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
                subscriptionPayload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            console.log("Error:renewSubscription", error?.response?.data);
        }
    }

    async getUserInfo(accessToken: string): Promise<any> {
        try {
            const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
                headers: {Authorization: `Bearer ${accessToken}`},
            });

            return responseMessage(
                200,
                "Successfully fetch refresh tokens",
                response?.data
            );
        } catch (error: any) {
            console.log("Error:getUserInfo", error?.response);
        }
    }

    async getUserMail(accessToken: string, id?: string): Promise<any> {
        let url = "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages";
        if (id) {
            url += `/${id}`;
        }

        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return responseMessage(200, "success", response?.data);
        } catch (error: any) {
            console.log("Error:getUserMail", error?.response?.data);
        }
    }

    async syncAllMessages(accessToken: string, userId: string): Promise<any> {
        try {
            let nextLink = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages`;
            let messages: any[] = [];

            while (nextLink) {
                const response = await axios.get(nextLink, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                let userRefId = userId;
                let messageChunk = response.data.value?.map((_item: any) => ({
                    messageId: _item.id,
                    userId: userRefId,
                    subject: _item.subject,
                    bodyPreview: _item.bodyPreview,
                    parentFolderId: _item.parentFolderId,
                    conversationId: _item.conversationId,
                    body: _item.body,
                    isRead: _item.isRead,
                    isFlagged: _item.flag?.flagStatus === "flagged",
                    isDraft: _item.isDraft,
                    messageType: this.getMessageType(_item),
                    sender: {
                        name: _item.sender?.emailAddress?.name,
                        address: _item.sender?.emailAddress?.address,
                    },
                    receiver: {
                        name: _item.toRecipients[0]?.emailAddress?.name,
                        address: _item.toRecipients[0]?.emailAddress?.address,
                    },
                    createAt: _item?.sentDateTime || new Date(),
                    updateAt: _item?.lastModifiedDateTime || new Date(),
                }));
               
                if(messageChunk.length>0){
                    await this.messageService.bulkUpsertMessages(messageChunk);
                }

                messages = [...messages, ...messageChunk];
                
                nextLink = response.data["@odata.nextLink"];
            }

            let upsertStatus = {
                status:200,
                messages:"Bulk upsert done"
            };

            console.log(`Successfully Sync:${messages.length} Messages`);

            await this.messageService.deleteMessage({
                query: {
                    bool: {
                        must_not: {
                            terms: {
                                messageId: messages.map((item) => item.messageId)
                            }
                        }
                    }
                }
            });

            await this.mailBoxService.updateMailBoxDetails({
                userId: userId
            })
            
            return upsertStatus;
        } catch (error: any) {
            console.log(`Messages Sync:Fail:${JSON.stringify(error?.response?.data, null, 2)}`);
        }
    }

    /**
     * Define message type like: reply,new,forward
     * @param message
     * @returns
     */
    getMessageType(message: any): string {
        const subject = message?.subject;
        if (subject) {
            if (subject.toLowerCase().startsWith("re:")) {
                return MESSAGE_TYPE_REPLY;
            } else if (subject.toLowerCase().startsWith("fw:")) {
                return MESSAGE_TYPE_FORWARD;
            }
        }
        return MESSAGE_TYPE_NEW;
    }


}
