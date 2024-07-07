import {Router, Request, Response} from "express";
import {UserService} from "../services/UserService";
import {PROVIDER_TYPE_OUTLOOK} from "../utils/Constant";
import {responseMessage} from "../utils/helpers";
import {OutlookOAuthProvider} from '../providers/OutlookOAuthProvider';
import {JwtTokenPayload} from "../models/User";
import {SessionMiddleware} from "../middleware/SessionMiddleWare";

const router = Router();
const userService = new UserService();
const outlookOAuthProvider = new OutlookOAuthProvider();

router.get("/user", SessionMiddleware, async (req: Request, res: Response) => {
    const {user} = req as any;
    const response = await userService.getUserById(user.id);
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
    const jwtTokenPayload: JwtTokenPayload = {
        id: response.data.id,
        username: response.data.username,
    }
    res.json({
        status: 200,
        message: "User created successfully",
        data: {
            id: response.data.id,
            username: response.data.username,
            redirectUrl: `${process.env.APP_URL}/auth/link/outlook/${response.data.id}`,
            accessToken: userService.generateAccessToken(jwtTokenPayload),
            refreshToken: userService.generateRefreshToken(jwtTokenPayload)
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

            console.log("code", code, "userId", userId);

            await outlookOAuthProvider.handleOutlookCallback(code, userId)

            const cronExpression = `* * * * *`;
            userService.scheduleUserCronJob(userId, cronExpression, async () => {
                await outlookOAuthProvider.renewTokenAndSubscription(userId)
            }).then(res => console.log("Cron Job Scheduled")).catch(err => console.log("Error:Cron Job", err));

            console.log(`Successfully handle ${providerType} callback`);
            res.status(200).json(responseMessage(400, "Success full"))
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

router.post("/:provider/refresh", async (req, res) => {
    const refreshToken = `M.C516_BAY.0.U.-CpQQ!QWjujm2iJuLu1gnTmiKJbTC*o0cnRNuTHlsweA17tgpF9kJ!0llzfmEVMBP!WjYBs3MsHQX4Ne3GBvM8mmXmemZE1DRaRr0rGCH2u!0JTxSFJTj9CrOl9md*R5DZJTri**Eg7sh2kvVoqqDRT6889ZdT9cZ5mrCY6gkYDNW17O!IhjDMAerUCOLj8ro37N0k6CSWxTP3!!rI1z*sd4c6eOI6kLqYxTbrzBPWfrmMOIjCLXFbwZPPcbicDBcPhbxBNKSWJRL9*TDrlTnaEC4Sh!OD14yVgraa1d6nW*tRWD5glynm1R2cxgBaJyjIapC4juxiVEesgcGsf81ZYW43v835xco!TrHUtBE2huC7x!y5urZ*t1fj3n2Dd7oRd0K6X8KjsD*tzon8fJyDmY$`;
    const {access_token, refresh_token} = await outlookOAuthProvider.refreshAccessToken(refreshToken);
    const subscription = await outlookOAuthProvider.renewSubscription(access_token, "649e3c0a-e083-4b9f-b948-d3219859712e");
    console.log(subscription);
    res.json(subscription);
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
                    await outlookOAuthProvider.syncMessage(user?.data?.accessToken, messageId, userId);
                    console.log(messageId);
                }
            }
            outlookOAuthProvider.handleNotification(req, res).then(res => console.log("Sync outlook message")).catch(err => console.log("Error:Sync OutLook Message", err))
            console.log(`Successfully handle ${providerType} notification callback`);
        }
        res.sendStatus(202);
    } catch (error: any) {
        console.log("error", error);
        res.status(400).json(responseMessage(400, error.message))
    }
});

export default router;
