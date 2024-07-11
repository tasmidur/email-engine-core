import {Router, Request, Response, NextFunction} from "express";
import {UserService} from "../services/UserService";
import {PROVIDER_TYPE_OUTLOOK} from "../utils/constant";
import {isExpire, responseMessage} from "../utils/helpers";
import {OutlookOAuthProvider} from '../providers/OutlookOAuthProvider';
import {JwtTokenPayload} from "../models/User";
import {SessionMiddleware} from "../middleware/SessionMiddleware";
import {OAuthContext} from "../providers/OAuthContext";

const router = Router();
const userService = new UserService();
const oauthContext = new OAuthContext(new OutlookOAuthProvider());

router.get("/user", SessionMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {user} = req as any;
        const response = await userService.getUserById(user.id);

        if (response.status !== 200) {
            return res.status(403).json(response);
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
    } catch (error: any) {
        console.log("error", error);
        res.status(401).json({
            message: "Unauthorized",
        });
    }
});


/**
 * User Register Handler
 */
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error: any) {
        console.log("error", error);
        next(error);
    }
});

router.get("/link/:provider/:userId", (req: Request, res: Response, next: NextFunction) => {
    try {
        const {provider: providerType, userId} = req.params;
        if (providerType == PROVIDER_TYPE_OUTLOOK) {
            const authorizationUrl = oauthContext.getAuthUrl(userId);
            res.redirect(authorizationUrl);
        }
    } catch (error: any) {
        console.log("error", error);
        next(error);
    }
});

/**
 * Provider callback handler
 */
router.get("/:provider/callback", async (req: Request, res: Response, next: NextFunction) => {

    const providerType: string = req.params.provider
    try {
        if (providerType == PROVIDER_TYPE_OUTLOOK) {
            const code = req.query.code as string;
            const userId = req.query.state as string;
            const {data: {user}} = await oauthContext.handleCallback(code, userId)
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
        next(error)
    }
});

/**
 * Handle real-time notifications
 */
router.post("/:provider/notifications", async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req?.query && req?.query?.validationToken) {
            res.send(req?.query?.validationToken);
            return;
        }

        const {provider: providerType} = req.params

        if (providerType == PROVIDER_TYPE_OUTLOOK) {
            const {value} = req.body;
            await oauthContext.handleNotificationCallback(value);
        }
        console.log(`Successfully handle ${providerType} notification callback`);
        res.sendStatus(202);
    } catch (error: any) {
        console.log("error", error);
        next(error);
    }
});

export default router;
