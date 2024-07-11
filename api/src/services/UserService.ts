import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {UserCreate, UserSchema, UserUpdate} from "../models/User";
import {USER_INDEX} from "../utils/constant";
import {formatedExpireTime, isExpire, responseMessage,} from "../utils/helpers";
import {ElasticSearchClient} from "../elasticSearchClient";

const elasticSearchClient = new ElasticSearchClient();

export class UserService {
    private indexName: string = USER_INDEX;

    async createUser(username: string, password: string): Promise<any> {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user: UserCreate = {
                username,
                password: hashedPassword,
                createAt: new Date(),
            };
            const userExist = await elasticSearchClient.searchDocuments(
                this.indexName,
                {
                    query: {
                        match: {
                            username: user.username,
                        },
                    },
                }
            );
            if (userExist.length) {
                return responseMessage(
                    200,
                    "User created successfully",
                    await elasticSearchClient.getDocument(
                        this.indexName,
                        (userExist[0] as any)?._id || ''
                    )
                );
            }
            const userCreated = await elasticSearchClient.createDocument(
                this.indexName,
                user
            );
            return responseMessage(200, "User created successfully", userCreated);
        } catch (error) {
            console.log("Error creating user", error);
            throw new Error("Error creating user")
        }
    }

    async getUserById(id: string): Promise<any> {
        try{
            const userDetail = await elasticSearchClient.getDocument(
                this.indexName,
                id
            );
            return responseMessage(200, "User Details", userDetail);
        }catch (error){
            console.log("Error:getUserById", error);
            throw new Error("Error:getUserById")
        }
    }

    async updateUser(userId: string, payload: UserUpdate): Promise<any> {
        try {
            const userResponse = await elasticSearchClient.updateDocument(
                this.indexName,
                userId,
                payload
            );
            return responseMessage(200, "User update successfully", userResponse);
        } catch (error: any) {
            console.log("Error:updateUser", error);
            throw new Error("Error:updateUser")
        }
    }

    generateAccessToken(payload: any) {
        return jwt.sign(payload, String(process.env.JWT_SECRET), {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        });
    }

    generateRefreshToken(payload: any) {
        return jwt.sign(
            {
                ...payload,
                refresh: true,
            },
            String(process.env.JWT_SECRET),
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            }
        );
    }

    async syncUsers(provider: any): Promise<any> {
        try {
            const users = await elasticSearchClient.searchDocuments(this.indexName, {
                query: {
                    match_all: {},
                },
            });

            for (let user of users) {
                await this.syncUserDetails(user, provider);
                // if (user.accessToken && user.refreshToken && user.notificationSubscriptionId) {
                //     {
                //         await this.syncUserDetails(user,provider);
                //     }
                // }
            }
        } catch (error: any) {
            console.log("Error:syncUsers", error)
            throw new Error("Error:syncUsers")
        }
    }

    async syncUserDetails(userInfo: any, provider: any): Promise<any> {
        let {
            accessToken,
            refreshToken,
            expireIn,
            notificationSubscriptionId,
            notificationSubscriptionExpirationDateTime,
            notificationCallBackUrl,
        } = userInfo?._source;
        let userId = userInfo?._id;

        console.log(
            "userInfo",
            isExpire(expireIn) ||
            !notificationSubscriptionId ||
            (notificationSubscriptionId &&
                isExpire(notificationSubscriptionExpirationDateTime))
        );
        //if (isExpire(expireIn) || !notificationSubscriptionId ||notificationCallBackUrl!=process.env.NOTIFICATION_HANDLER_URL|| (notificationSubscriptionId && isExpire(notificationSubscriptionExpirationDateTime))) {
        /**
         * Refresh token if expire
         */
            //if (isExpire(expireIn)) {
        const {access_token, refresh_token, expires_in} =
                await provider.refreshAccessToken(refreshToken);
        console.log("RefreshToken:", access_token, refresh_token, expires_in);
        if (access_token && refresh_token && expires_in) {
            accessToken = access_token;
            refreshToken = refresh_token;
            expireIn = formatedExpireTime(expires_in);
        }
        //} else if (accessToken) {
        ///if (notificationSubscriptionId && isExpire(notificationSubscriptionExpirationDateTime)) {
        const subscriptionRenew = await provider.renewSubscription(accessToken, notificationSubscriptionId);
        console.log("renew subscriptionRenew:", subscriptionRenew);
        if (subscriptionRenew?.id && subscriptionRenew?.expirationDateTime) {
            notificationSubscriptionId = subscriptionRenew?.id;
            notificationSubscriptionExpirationDateTime = formatedExpireTime(
                subscriptionRenew?.expirationDateTime
            );
            notificationCallBackUrl = subscriptionRenew?.notificationUrl;
        }
        //} else if (!notificationSubscriptionId || notificationCallBackUrl!=process.env.NOTIFICATION_HANDLER_URL) {
        const subscription = await provider.toSubscribe(accessToken, userInfo.id);
        if (subscription?.id && subscription?.expirationDateTime) {
            notificationSubscriptionId = subscription?.id;
            notificationSubscriptionExpirationDateTime = formatedExpireTime(
                subscription?.expirationDateTime
            );
            notificationCallBackUrl = subscription?.notificationUrl;
        }

        //}

        // }
        // Update user details
        const userPayload: any = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expireIn: expireIn,
            notificationSubscriptionId: notificationSubscriptionId,
            notificationSubscriptionExpirationDateTime:
            notificationSubscriptionExpirationDateTime,
            updateAt: new Date(),
        };
        await this.updateUser(userId, userPayload);
        await provider.syncAllMessages(accessToken, userId);
        //}
    }

}
