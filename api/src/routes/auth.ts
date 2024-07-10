import {Router, Request, Response} from "express";
import {UserService} from "../services/UserService";
import {PROVIDER_TYPE_OUTLOOK} from "../utils/Constant";
import {isExpire, responseMessage} from "../utils/helpers";
import {OutlookOAuthProvider} from '../providers/OutlookOAuthProvider';
import {JwtTokenPayload} from "../models/User";
import {SessionMiddleware} from "../middleware/SessionMiddleWare";
import {publishMessage} from "../socketClient";

const router = Router();
const userService = new UserService();
const outlookOAuthProvider = new OutlookOAuthProvider();

router.get("/user", SessionMiddleware, async (req: Request, res: Response) => {
    const {user} = req as any;
    const response = await userService.getUserById(user.id);

    if (response.status !== 200) {
        return res.status(500).json(response);
    }

    if (response?.data?.accessToken && isExpire(response?.data.expireIn)) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }

    res.json({
        status: 200,
        message: "User fetch success",
        data: {
            id: response.data.id,
            username: response.data.username
        },
    });
});


/**
 * User Register Handler
 */
router.post("/register", async (req: Request, res: Response) => {
    const {username, password} = req.body;
    const response = await userService.createUser(username, password);

    if (response.status !== 200) {
        return res.status(500).json(response);
    }
    res.json({
        status: 200,
        message: "User created successfully",
        data: {
            id: response.data.id,
            username: response.data.username,
            redirectUrl: `${process.env.APP_URL}/auth/link/outlook/${response.data.id}`
        },
    });
});

router.get("/link/:provider/:userId", (req: Request, res: Response) => {
    const {provider: providerType, userId} = req.params;
    if (providerType == PROVIDER_TYPE_OUTLOOK) {
        const authorizationUrl = outlookOAuthProvider.getAuthUrl(userId);
        res.redirect(authorizationUrl);
    }

});

/**
 * Provider callback handler
 */
router.get("/:provider/callback", async (req: Request, res: Response) => {

    const providerType: string = req.params.provider
    try {
        if (providerType == PROVIDER_TYPE_OUTLOOK) {
            const code = req.query.code as string;
            const userId = req.query.state as string;
            const {data: {user}} = await outlookOAuthProvider.handleOutlookCallback(code, userId)
            if (user) {
                console.log(`Successfully handle ${providerType} callback`);
                const jwtTokenPayload: JwtTokenPayload = {
                    id: user?.id,
                    username: user?.username,
                    provider: providerType
                }

                const accessToken = userService.generateAccessToken(jwtTokenPayload);
                const refreshToken = userService.generateRefreshToken(jwtTokenPayload)

                res.cookie("accessToken", accessToken)
                res.cookie("refreshToken", refreshToken)
                res.redirect(302, `${process.env.FRONTEND_APP_URL}`);

            } else {
                res.status(400).json(responseMessage(400, "Error linking account"))
            }

            /**
             * add here frontend url
             */
        } else {
            res.status(400).json(responseMessage(400, "Invalid provider"))
        }
    } catch (error: any) {
        console.log("error", error);
        res.status(400).json(responseMessage(400, error.message))
    }
});

/**
 * Handle real-time notifications
 */
router.post("/:provider/notifications", async (req, res) => {
    const {provider: providerType} = req.params
    try {
        if (req.query && req.query.validationToken) {
            res.send(req.query.validationToken);
            return;
        }
        if (providerType == PROVIDER_TYPE_OUTLOOK) {
            const {value} = req.body;
            for (const notification of value) {
                let userId = notification?.clientState;
                let messageId = notification?.resourceData?.id;
                if (userId) {
                    let user = await userService.getUserById(userId);
                    console.log("same id",user?.data?.notificationSubscriptionId === notification?.subscriptionId);
                    
                    if (user?.data?.notificationSubscriptionId === notification?.subscriptionId) {

                        outlookOAuthProvider.syncAllMessages(user?.data?.accessToken, userId).then(res => {
                           console.log("sync message......");
                            publishMessage(userId, {
                                userId,
                                messageId
                            });
                        })

                    }
                }
            }
        }
        console.log(`Successfully handle ${providerType} notification callback`);
        res.sendStatus(202);
    } catch (error: any) {
        console.log("error", error);
        res.status(400).json(responseMessage(400, error.message))
    }
});

export default router;
