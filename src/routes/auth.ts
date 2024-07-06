import { Router, Request, Response } from "express";
import { UserService } from "../services/UserService";
import { PROVIDER_TYPE_OUTLOOK } from "../utils/Constant";
import {  responseMessage } from "../utils/helpers";
import { OutlookOAuthProvider } from '../providers/OutlookOAuthProvider';

const router = Router();
const userService = new UserService();
const outlookOAuthProvider=new OutlookOAuthProvider();
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


router.get("/link/:provider/:userId", (req: Request, res: Response) => {
  const { provider:providerType,userId } = req.params;

  if (providerType==PROVIDER_TYPE_OUTLOOK) {
    const authorizationUrl = outlookOAuthProvider.getAuthUrl(userId);
    res.redirect(authorizationUrl);
  }

});

/**
 * Provider callback handler
 */
router.get("/:provider/callback", async (req: Request, res: Response) => {
  const providerType:string=req.params.provider
  if (providerType==PROVIDER_TYPE_OUTLOOK) {
    const code = req.query.code as string;
    const userId = req.query.state as string;

    console.log("code",code,"userId",userId);
    
    outlookOAuthProvider.handlOutlookCallback(code,userId)
    const cronExpression=`* * * * *`;
    // const tokenApdateScheduler=await userService.scheduleUserCronJob(userId,cronExpression,async()=>{
    //   await outlookOAuthProvider.renewTokenAndSubscription(userId)
    // })
    console.log(`Successfully handle ${providerType} callback`);
    res.status(200).json(responseMessage(400,"Success full"))
    /**
     * add here frontend url
     */
  }else{
    res.status(400).json(responseMessage(400,"Invalid provider"))
  }
 
});

/**
 * Handle real-time notifications
 */
router.post("/:provider/notifications", async (req, res) => {
  const {provider:providerType}=req.params
  if (req.query && req.query.validationToken) {
    res.send(req.query.validationToken);
    return;
  }

  if (providerType==PROVIDER_TYPE_OUTLOOK) {
    const { value } = req.body;
    for (const notification of value) {
      let userId = notification?.clientState;
      let messageId = notification?.resourceData?.id;

      if (userId) {
        let user = await userService.getUserById(userId);
        await outlookOAuthProvider.syncMessage(user?.data?.accessToken, messageId, userId);
        console.log(messageId);
      }
    }
   // outlookOAuthProvider.handleNotification(req,res);
    console.log(`Successfully handle ${providerType} notification callback`);
    res.sendStatus(202);
  }
  
});

export default router;
