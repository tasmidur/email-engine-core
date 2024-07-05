// src/routes/auth.ts
import { Router, Request, Response } from "express";
import { UserService } from "../services/UserService";
import { OutlookOAuthProvider } from "../providers/OutlookOAuthProvider";
import { UserUpdate } from "../models/User";
import { PROVIDER_TYPE_OUTLOOK } from "../utils/Constant";
import { responseMessage } from "../utils/helpers";
import { markAsUntransferable } from "worker_threads";


const router = Router();
const userService = new UserService();
const oauthProvider = new OutlookOAuthProvider();

/**
 * User Register Handler
 */
router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const response = await userService.createUser(username, password);

  if (response.status !== 200) {
    return res.status(500).json(response);
  }

  const jwtToken = userService.generateJwt({
    id: response.data.id,
    username: response.data.username,
  });
  res.json({
    status: 200,
    message: "User created successfully",
    data: {
      id: response.data.id,
      username: response.data.username,
      rediredUrl: `${process.env.APP_URL}/auth/link-outlook/${response.data.id}`,
      token: jwtToken,
    },
  });
});

/**
 * After registration it create to outlook
 */
router.post("/link-outlook/:userId", async (req: Request, res: Response) => {
  const { oauth_email, oauth_provider_type, oauth_refresh_token } = req.body;
  const { userId } = req.params;
  const userPayload: any = {
    oauth_email,
    oauth_provider_type,
    oauth_refresh_token,
  };

  try {
    const user = await userService.updateUser(userId, userPayload);
    res.json({
      user_id: user,
    });
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

router.get("/link-outlook/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const authorizationUrl = oauthProvider.getAuthUrl(userId);
  res.redirect(authorizationUrl);
});

/**
 * Outlook callback handler
 */
router.get("/outlook/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = req.query.state as string;

  try {
    const { access_token, refresh_token, expires_in } =
      await oauthProvider.getTokenFromCode(code);
    const userData = await oauthProvider.getUserInfo(access_token);

    const tokenExpires = new Date(
      Date.now() + (parseInt(expires_in) - 300) * 1000
    );

    const userPayload: UserUpdate = {
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
     * updateUser details
     */
    await userService.updateUser(userId, userPayload);
    /**
     * syncAllMessages by access token
     */
    oauthProvider
      .syncAllMessages(access_token, userId)
      .then((res) => console.log(res));

    /**
     * subscribe to OutlookWebhook for real time mail change notifications
     */
    await oauthProvider.subscribe(access_token,userId);

    res.json(responseMessage(200, "Outlook account linked successfully"));
  } catch (error) {
    console.log(error);
    res.status(500).json(
      responseMessage(200, "Error linking Outlook account", {
        errors: error,
      })
    );
  }
});

/**
 * Handle real-time notifications
 */
router.post("/notifications", async (req, res) => {
  if (req.query && req.query.validationToken) {
    res.send(req.query.validationToken);
    return;
  }

  const { value } = req.body;
  for (const notification of value) {
     let userId=notification?.clientState; 
     let messageId=notification?.resourceData?.id;
     if(userId){
      let user=await userService.getUserById(userId);
      const syncMessage=await oauthProvider.syncMessage(user?.data?.accessToken,messageId,userId)
      console.log(messageId);
     }
     
  }

  res.sendStatus(202);
});

export default router;
