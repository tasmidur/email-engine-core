import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserCreate, UserSchema, UserUpdate } from "../models/User";
import { USER_INDEX } from "../utils/constant";
import {
  formatedExpireTime,
  isExpire,
  responseMessage,
} from "../utils/helpers";
import { ElasticSearchClient } from "../elasticSearchClient";
import { decrypt, encrypt } from "../crypto";

const elasticSearchClient = new ElasticSearchClient();

/**
 * UserService class provides methods for creating, retrieving, updating users,
 * generating access and refresh tokens, and syncing user details with external providers.
 */
export class UserService {
  private indexName: string = USER_INDEX;

  constructor() {
    elasticSearchClient
      .initElasticsearch([UserSchema])
      .then((res: any) => console.log("Elasticsearch user index initialized"))
      .catch((err: any) => console.log(err));
  }

  /**
   * Creates a new user with the specified username and password.
   *
   * @param {string} username - The username of the new user.
   * @param {string} password - The password of the new user.
   * @returns {Promise<any>} A promise that resolves to the response message containing user details.
   */
  async createUser(username: string, password: string): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user: UserCreate = {
        username,
        password: hashedPassword,
        createAt: new Date(),
      };

      const userExist: any[] = await elasticSearchClient.searchDocuments(
        this.indexName,
        {
          query: {
            match: { username: user.username },
          },
        }
      );

      if (userExist.length > 0) {
        const existingUser = await elasticSearchClient.getDocument(
          this.indexName,
          userExist[0]._id
        );
        return responseMessage(200, "User already exists", existingUser);
      }

      const userCreated = await elasticSearchClient.createDocument(
        this.indexName,
        user
      );
      return responseMessage(200, "User created successfully", userCreated);
    } catch (error) {
      console.error("Error creating user", error);
      throw new Error("Error creating user");
    }
  }

  /**
   * Retrieves user details by user ID.
   *
   * @param {string} id - The ID of the user to retrieve.
   * @returns {Promise<any>} A promise that resolves to the response message containing user details.
   */
  async getUserById(id: string): Promise<any> {
    try {
      const userDetail = await elasticSearchClient.getDocument(
        this.indexName,
        id
      );
      let response = responseMessage(200, "User Details", userDetail);
      if (response?.data?.accessToken) {
        response = {
          ...response,
          data: {
            ...response?.data,
            accessToken: decrypt(response?.data?.accessToken),
          },
        };
      }
      return response;
    } catch (error) {
      console.error("Error:getUserById", error);
      throw new Error("Error:getUserById");
    }
  }

  /**
   * Updates user details by user ID.
   *
   * @param {string} userId - The ID of the user to update.
   * @param {UserUpdate} payload - The user data to update.
   * @returns {Promise<any>} A promise that resolves to the response message containing updated user details.
   */
  async updateUser(userId: string, payload: UserUpdate): Promise<any> {
    try {
      if (payload?.accessToken) {
        payload = {
          ...payload,
          accessToken: encrypt(payload?.accessToken)
        };
      }
      const userResponse = await elasticSearchClient.updateDocument(
        this.indexName,
        userId,
        payload
      );
      return responseMessage(200, "User updated successfully", userResponse);
    } catch (error) {
      console.error("Error:updateUser", error);
      throw new Error("Error:updateUser");
    }
  }

  /**
   * Generates an access token for the given payload.
   *
   * @param {any} payload - The data to include in the access token.
   * @returns {string} The generated access token.
   */
  generateAccessToken(payload: any): string {
    return jwt.sign(payload, String(process.env.JWT_SECRET), {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Generates a refresh token for the given payload.
   *
   * @param {any} payload - The data to include in the refresh token.
   * @returns {string} The generated refresh token.
   */
  generateRefreshToken(payload: any): string {
    return jwt.sign(
      { ...payload, refresh: true },
      String(process.env.JWT_SECRET),
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  }

  /**
   * Synchronizes users with the external provider.
   *
   * @param {any} provider - The external provider for synchronization.
   * @returns {Promise<void>} A promise that resolves when synchronization is complete.
   */
  async syncUsers(provider: any): Promise<void> {
    try {
      let users: any = await elasticSearchClient.searchDocuments(
        this.indexName,
        {
          query: { match_all: {} },
        }
      );

      users = users.map((user: any) => ({
        id: user._id,
        ...user._source,
      }));

      for (const user of users) {
        if (
          user.accessToken &&
          user.refreshToken &&
          user.notificationSubscriptionId
        ) {
          await this.syncUserDetails(user, provider);
        }
      }
    } catch (error) {
      console.error("Error:syncUsers", error);
      throw new Error("Error:syncUsers");
    }
  }

  /**
   * Synchronizes user details with the external provider.
   *
   * @param {any} userInfo - The user information to synchronize.
   * @param {any} provider - The external provider for synchronization.
   * @returns {Promise<void>} A promise that resolves when synchronization is complete.
   */
  async syncUserDetails(userInfo: any, provider: any): Promise<void> {
    let {
      id: userId,
      accessToken,
      refreshToken,
      expireIn,
      notificationSubscriptionId,
      notificationSubscriptionExpirationDateTime,
      notificationCallBackUrl,
    } = userInfo;

    let isSubscriptionRenew = false;

    const shouldRefreshToken = isExpire(expireIn);
    const shouldRenewSubscription =
      notificationSubscriptionId &&
      isExpire(notificationSubscriptionExpirationDateTime);
    const shouldCreateSubscription =
      !notificationSubscriptionId ||
      notificationCallBackUrl !== process.env.NOTIFICATION_HANDLER_URL;

    if (
      shouldRefreshToken ||
      shouldRenewSubscription ||
      shouldCreateSubscription
    ) {
      if (shouldRefreshToken) {
        const { access_token, refresh_token, expires_in } =
          await provider.refreshAccessToken(refreshToken);
        if (access_token && refresh_token && expires_in) {
          accessToken = access_token;
          refreshToken = refresh_token;
          expireIn = formatedExpireTime(expires_in);
        }
      } else if (shouldRenewSubscription) {
        const subscriptionRenew =
          await provider.renewSubscriptionForNotification(
            accessToken,
            notificationSubscriptionId
          );
        isSubscriptionRenew = Boolean(subscriptionRenew?.id);
        if (subscriptionRenew?.id && subscriptionRenew?.expirationDateTime) {
          notificationSubscriptionId = subscriptionRenew.id;
          notificationSubscriptionExpirationDateTime = formatedExpireTime(
            subscriptionRenew.expirationDateTime
          );
          notificationCallBackUrl = subscriptionRenew.notificationUrl;
        }
      } else if (!isSubscriptionRenew || shouldCreateSubscription) {
        const subscription = await provider.subscriptionForNotification(
          accessToken,
          userId
        );
        if (subscription?.id && subscription?.expirationDateTime) {
          notificationSubscriptionId = subscription.id;
          notificationSubscriptionExpirationDateTime = formatedExpireTime(
            subscription.expirationDateTime
          );
          notificationCallBackUrl = subscription.notificationUrl;
        }
      }

      const userPayload: Partial<UserUpdate> = {
        accessToken,
        refreshToken,
        expireIn,
        notificationSubscriptionId,
        notificationSubscriptionExpirationDateTime,
        notificationCallBackUrl,
        updateAt: new Date(),
      };
      await this.updateUser(userId, userPayload);
      await provider.syncAllMessages(accessToken, userId);
    }
  }
}
