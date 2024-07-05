// src/strategies/OutlookOAuthStrategy.ts
import axios from "axios";
import querystring from "querystring";
import { OAuthProvider } from "./OAuthProvider";
import { config as dotenvConfig } from "dotenv";
import {
  MESSAGE_TYPE_FORWARD,
  MESSAGE_TYPE_NEW,
  MESSAGE_TYPE_REPLY,
} from "../utils/Constant";
import { MessageService } from "../services/MessageService";
import { UserService } from "../services/UserService";
import { responseMessage } from "../utils/helpers";
import { Message } from "../models/Message";
dotenvConfig();

export class OutlookOAuthProvider implements OAuthProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authorizationBaseUrl: string;
  private tokenUrl: string;
  private scope: string;
  private mssageService: MessageService;
  private userService: UserService;

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
    this.mssageService = new MessageService();
    this.userService = new UserService();
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
    const tokenData = querystring.stringify({
      client_id: this.clientId,
      scope: this.scope,
      code,
      redirect_uri: this.redirectUri,
      grant_type: "authorization_code",
      client_secret: this.clientSecret,
    });

    const response = await axios.post(this.tokenUrl, tokenData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    //console.log(response.data);

    return response.data;
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await axios.post(this.tokenUrl, {
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        client_id: this.clientId,
        scope: this.scope,
        client_secret: this.clientSecret,
      });

      return response?.data;
    } catch (error: any) {
      return {
        status: error?.response?.status,
        ...error?.response?.data,
      };
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const graphUrl = "https://graph.microsoft.com/v1.0/me";
    const response = await axios.get(graphUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async getUserMail(accessToken: string, id?: string): Promise<any> {
    let url = "https://graph.microsoft.com/v1.0/me/messages";
    if (id) {
      url += `/${id}`;
    }
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return responseMessage(200, "success", response.data);
    } catch (error: any) {
      const { status, message, data } = error?.response;
      return responseMessage(status, message, data);
    }
  }

  async syncMessage(accessToken: string, messageId: string, userId: string) {
    const updateMessage = await this.getUserMail(accessToken, messageId);
    if (updateMessage?.status === 200 && updateMessage?.data) {
      const _item = updateMessage?.data ?? {};
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
            address:_item.sender?.emailAddress?.address
        },
        receiver: {
            name: _item.toRecipients[0]?.emailAddress?.name,
            address:_item.toRecipients[0]?.emailAddress?.address
        }
      };
      //console.log("message",_item);
      
      await this.mssageService.syncMessages([syncMessagePayload]);
    }
  }

  async syncAllMessages(accessToken: string, userId: string): Promise<void> {
    let nextLink = `https://graph.microsoft.com/v1.0/me/messages`;
    while (nextLink) {
      const response = await axios.get(nextLink, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      let userRefId = userId;
      let messages = response.data.value?.map((_item: any) => ({
        messageId: _item.id,
        userId: userRefId,
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
            address:_item.sender?.emailAddress?.address
        },
        receiver: {
            name: _item.toRecipients[0]?.emailAddress?.name,
            address:_item.toRecipients[0]?.emailAddress?.address
        }
      }));
      await this.mssageService.syncMessages(messages);
      nextLink = response.data["@odata.nextLink"];
    }
    console.log("message synce");
  }

  async subscribe(accessToken: string, userId: string) {
    try {
      const subscriptionPayload = {
        changeType: "created,updated,deleted",
        notificationUrl: `${process.env.NOTIFICATION_HANDLER_URL}`,
        resource: `/me/messages`,
        expirationDateTime: new Date(
          new Date().getTime() + 3600 * 1000 * 87
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

      console.log("Subscription created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return error;
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
