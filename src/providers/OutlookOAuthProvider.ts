import axios from "axios";
import querystring from "querystring";
import { OAuthProvider } from "./OAuthProvider";
import { config as dotenvConfig } from "dotenv";
import {
  MESSAGE_TYPE_FORWARD,
  MESSAGE_TYPE_NEW,
  MESSAGE_TYPE_REPLY,
  PROVIDER_TYPE_OUTLOOK,
} from "../utils/Constant";
import { MessageService } from "../services/MessageService";
import { UserService } from "../services/UserService";
import { responseMessage } from "../utils/helpers";
import { UserUpdate } from "../models/User";
import { Request, Response } from "express";


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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return responseMessage(200, "Successfully fetch tokens", response.data);
    } catch (error: any) {
      console.log("Error:getTokenFromCode", error?.response);
      const { status = 500, message = "Error", data = {} } = error?.response;
      return responseMessage(status, message, data);
    }
  }

  async renewTokenAndSubscription(userId: string): Promise<any> {
    const { data } = await this.userService.getUserById(userId);
    const { accessToken, refreshToken, expireIn, notificationSubscriptionId } =
      data;
    console.log(accessToken, refreshToken, expireIn);

    if (this.userService.isAccessTokenExpire(expireIn)) {
      const refreshTokenData = await this.refreshAccessToken(refreshToken);
      if (refreshTokenData?.status === 200) {
        const { access_token, refresh_token, expires_in } =
          refreshTokenData.data;

        const tokenExpires = new Date(
          Date.now() + (parseInt(expires_in) - 300) * 1000
        );

        let userPayload: any = {
          accessToken: access_token || "",
          refreshToken: refresh_token || "",
          expireIn: tokenExpires || new Date(),
          updateAt: new Date(),
        };

        /**
         * toSubscribe to OutlookWebhook for real time mail change notifications
         */
        const { status, data: subcriptionCreate } =
          await this.renewSubscription(
            access_token,
            notificationSubscriptionId
          );
        if (status === 200) {
          const subscriptionExpires = new Date(
            Date.now() +
              (parseInt(subcriptionCreate?.expirationDateTime) - 300) * 1000
          );
          userPayload = {
            ...userPayload,
            notificationSubscriptionId: subcriptionCreate?.id,
            notificationSubscriptionExpirationDateTime: subscriptionExpires,
          };
        } else {
          console.log("Subscription creation fail");
        }
        /**
         * updateUser details
         */
        await this.userService.updateUser(userId, userPayload);

        /**
         * Renew Subscription
         */
      }
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(this.tokenUrl, {
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        client_id: this.clientId,
        scope: this.scope,
        client_secret: this.clientSecret,
      });
      console.log("Success refresh token", response?.data);

      return responseMessage(
        200,
        "Successfully fetch refresh tokens",
        response?.data
      );
    } catch (error: any) {
      console.log("Error:refreshAccessToken", error?.response);
      const { status = 500, message = "Error", data = {} } = error?.response;
      return responseMessage(status, message, data);
    }
  }

  async handlOutlookCallback(code: string, userId: string): Promise<any> {
    try {
      const {
        data: { access_token, refresh_token, expires_in },
      } = await this.getTokenFromCode(code);

      const { data: userData } = await this.getUserInfo(access_token);

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
      const { status, data: subcriptionCreate } = await this.toSubscribe(
        access_token,
        userId
      );
      console.log("subscription",subcriptionCreate);
      
      // if (status === 200) {
      //   const subscriptionExpires = new Date(
      //     Date.now() +
      //       (parseInt(subcriptionCreate?.expirationDateTime) - 300) * 1000
      //   );
      //   userPayload = {
      //     ...userPayload,
      //     notificationSubscriptionId: subcriptionCreate?.id,
      //     notificationSubscriptionExpirationDateTime: subscriptionExpires,
      //   };
      // } else {
      //   console.log("Subscription creation fail");
      // }

      /**
       * updateUser details
       */
      //await this.userService.updateUser(userId, userPayload);
      /**
       * syncAllMessages by access token
       */
      // this.syncAllMessages(access_token, userId).then((res) =>
      //   console.log(res)
      // );

      return responseMessage(200, "Outlook account linked successfully");
    } catch (error: any) {
      console.log("Error:handlOutlookCallback", error?.response);
      const { status = 500, message = "Error", data = {} } = error?.response;
      return responseMessage(status, message, data);
    }
  }

  async toSubscribe(accessToken: string, userId: string): Promise<any> {
    try {
      const subscriptionPayload = {
        changeType: "created,updated,deleted",
        notificationUrl: `${process.env.NOTIFICATION_HANDLER_URL}`,
        resource: `/me/messages`,
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
      console.log("Subscription created:", response.data);
      //return responseMessage(200, "Subscription created:", response.data);
    } catch (error: any) {
      console.log("Error:toSubscribe", error);
    }
  }

  async renewSubscription(
    accessToken: string,
    subscriptionId: string
  ): Promise<any> {
    try {
      const subscriptionPayload = {
        expirationDateTime: new Date(
          new Date().getTime() + 3600 * 1000
        ).toISOString(), // 1 hour from now
      };

      // Send POST request to Graph API to create subscription
      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
        subscriptionPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Subscription renew created:", response.data);
      return responseMessage(200, "Subscription renew created:", response.data);
    } catch (error: any) {
      console.log("Error:renewSubscription", error?.response);
      const { status = 500, message = "Error", data = {} } = error?.response;
      return responseMessage(status, message, data);
    }
  }

  async handleNotification(req: Request, res: Response): Promise<any> {
    try {
      if (req.query && req.query.validationToken) {
        res.send(req.query.validationToken);
        return;
      }
      const { value } = req.body;
      for (const notification of value) {
        let userId = notification?.clientState;
        let messageId = notification?.resourceData?.id;

        if (userId) {
          let user = await this.userService.getUserById(userId);
          await this.syncMessage(user?.data?.accessToken, messageId, userId);
          console.log(messageId);
        }
      }
      
     console.log(responseMessage(200, "Outlook notification handle successful"));
     
    } catch (error: any) {
      console.log("Error:handleNotification", error?.response);
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return responseMessage(
        200,
        "Successfully fetch refresh tokens",
        response?.data
      );
    } catch (error: any) {
      console.log("Error:getUserInfo", error?.response);
      const { status = 500, message = "Error", data = {} } = error?.response;
      return responseMessage(status, message, data);
    }
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
      return responseMessage(200, "success", response?.data);
    } catch (error: any) {
      console.log("Error:getUserMail", error?.response);
      const { status = 500, message = "Error", data = {} } = error?.response;
      return responseMessage(status, message, data);
    }
  }

  async syncMessage(accessToken: string, messageId: string, userId: string) {
    try {
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
            address: _item.sender?.emailAddress?.address,
          },
          receiver: {
            name: _item.toRecipients[0]?.emailAddress?.name,
            address: _item.toRecipients[0]?.emailAddress?.address,
          },
        };
        await this.mssageService.syncMessages([syncMessagePayload]);
        console.log("Message Sync:Successfull", syncMessagePayload.messageId);
      }
    } catch (error: any) {
      console.log("Message Sync:Fail");
    }
  }

  async syncAllMessages(accessToken: string, userId: string): Promise<void> {
    try {
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
            address: _item.sender?.emailAddress?.address,
          },
          receiver: {
            name: _item.toRecipients[0]?.emailAddress?.name,
            address: _item.toRecipients[0]?.emailAddress?.address,
          },
        }));
        await this.mssageService.syncMessages(messages);
        nextLink = response.data["@odata.nextLink"];
      }
      console.log("Messages sync:Success");
    } catch (error: any) {
      console.log("Messages Sync:Fail");
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
