import axios from "axios";
import querystring from "querystring";
import {OAuthProvider} from "./OAuthProvider";
import {config as dotenvConfig} from "dotenv";
import {
    MESSAGE_TYPE_FORWARD,
    MESSAGE_TYPE_NEW,
    MESSAGE_TYPE_REPLY,
    PROVIDER_TYPE_OUTLOOK,
} from "../utils/Constant";
import {MessageService} from "../services/MessageService";
import {UserService} from "../services/UserService";
import {formatedExpireTime, isExpire, responseMessage} from "../utils/helpers";
import {UserUpdate} from "../models/User";
import {Request, Response} from "express";
import {publishMessage} from "../socketClient";
import {MailBoxService} from "../services/MailBoxService";


dotenvConfig();

export class OutlookOAuthProvider implements OAuthProvider {
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
            console.log("Error:getTokenFromCode", error?.response);
            const {status = 500, message = "Error", data = {}} = error?.response;
            return responseMessage(status, message, data);
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
            console.log("refreshAccessToken", response.data)
            return response.data;
        } catch (error: any) {
            console.log("Error:refreshAccessToken", error?.response?.data);
            throw new Error(`\nError:refreshAccessToken:${JSON.stringify(error?.response?.data, null, 2)}`);
        }
    }

    async handleOutlookCallback(code: string, userId: string): Promise<any> {
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
            const subscriptionCreate = await this.toSubscribe(
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
                    notificationCallBackUrl:subscriptionCreate?.notificationUrl
                };
            }

            /**
             * updateUser details
             */
            const updatedUser = await this.userService.updateUser(userId, userPayload);

            /**
             * syncAllMessages by access token
             */
            this.syncAllMessages(access_token, userId).then((res) =>
                console.log("syncAllMessages")
            ).catch((err) => console.log("syncAllMessages:Error:", err));
            return responseMessage(200, "Outlook account linked successfully", {
                user: updatedUser?.data
            });
        } catch (error: any) {
            console.log("\nError:handleOutlookCallback", error)
            throw new Error("\nError:handleOutlookCallback")
        }
    }

    async toSubscribe(accessToken: string, userId: string): Promise<any> {
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

            // Send POST request to Graph API to create subscription
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
            console.log("\n Error:toSubscribe:", error?.response?.data);
            throw new Error(`\n Error:toSubscribe:${JSON.stringify(error?.response?.data, null, 2)}`);
        }
    }

    async renewSubscription(accessToken: string, subscriptionId: string): Promise<any> {
        try {
            const subscriptionPayload = {
                expirationDateTime: new Date(
                    new Date().getTime() + 3600 * 1000
                ).toISOString(), // 1 hour from now
            };

            // Send POST request to Graph API to create subscription
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
            console.log("\nError:renewSubscription", error?.response?.data);
            throw new Error(`\nError:renewSubscription:${JSON.stringify(error?.response?.data, null, 2)}`);
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
            const {status = 500, message = "Error", data = {}} = error?.response;
            return responseMessage(status, message, data);
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
            console.log("Error:getUserMail", error?.response);
            const {status = 500, message = "Error", data = {}} = error?.response;
            return responseMessage(status, message, data);
        }
    }

    async syncMessage(accessToken: string, messageId: string, userId: string) {
        try {
            const updatedMessage = await this.getUserMail(accessToken, messageId);
            if (updatedMessage?.status === 200 && updatedMessage?.data) {
                const _item = updatedMessage?.data ?? {};
                const syncMessagePayload = {
                    messageId: _item.id,
                    userId: userId,
                    subject: _item.subject,
                    bodyPreview: _item.bodyPreview,
                    parentFolderId: _item.parentFolderId,
                    conversationId: _item.conversationId,
                    body: _item.body,
                    isRead: _item.isRead,
                    isDraft: _item.isDraft,
                    messageType: this.getMessageType(_item),
                    sender: {
                        name: _item.sender?.emailAddress?.name,
                        address: _item.sender?.emailAddress?.address,
                    },
                    receiver: {
                        name: _item.from?.emailAddress?.name,
                        address: _item.from?.emailAddress?.address,
                    },
                    createAt: _item?.sentDateTime || new Date(),
                    updateAt: _item?.lastModifiedDateTime || new Date(),
                };
                console.log("updatedMessage", updatedMessage)
                console.log("syncMessagePayload", syncMessagePayload)
                await this.messageService.syncMessages([syncMessagePayload]);
                await this.mailBoxService.updateMailBoxDetails({
                    userId: userId
                })
                console.log("Message Sync:Successfully", syncMessagePayload.messageId);
            }
        } catch (error: any) {
            console.log("Message Sync:Fail");
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
                messages = [...messages, ...messageChunk];
                await this.messageService.syncMessages(messageChunk)
                nextLink = response.data["@odata.nextLink"];
            }

            let upsertStatus = {};
            console.log("Messages Sync:Successfully", messages.length);
            
                await this.messageService.deleteMessage({
                    "query": {
                        "bool": {
                            "must_not": {
                                "terms": {
                                    "messageId": messages.map((item) => item.messageId)
                                }
                            }
                        }
                    },
                });
            
            await this.mailBoxService.updateMailBoxDetails({
                userId: userId
            })
            return upsertStatus;
        } catch (error: any) {
            console.log(`\nMessages Sync:Fail:${JSON.stringify(error?.response, null, 2)}`);
            throw new Error(`\nMessages Sync:Fail:${JSON.stringify(error?.response, null, 2)}`);
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
