// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { OutlookOAuthProvider } from '../providers/OutlookOAuthProvider';
import { User, UserUpdate } from '../models/User';

const router = Router();
const userService = new UserService();
const oauthProvider = new OutlookOAuthProvider();

router.post('/webhook', (req: Request, res: Response) => {
    console.log('Received webhook notification:', req.body);
    // Handle the webhook notification here
    // For example, process the notification and send a response
    res.status(200).send('Webhook notification received successfully');
});

router.post('/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
        const user = await userService.createUser(username, password);
        const jwtToken = userService.generateJwt(user);
        res.json({ 
            user_id:user?._id,
            token: jwtToken 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});


router.post('/link-outlook/:userId', async (req: Request, res: Response) => {
    const { oauth_email,oauth_provider_type, oauth_refresh_token} = req.body;
    const { userId } = req.params;
    const userPayload:any={
        oauth_email,
        oauth_provider_type, 
        oauth_refresh_token
    }

    try {
        const user = await userService.updateUser(userId, userPayload);
        res.json({ 
            user_id:user,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});


router.get('/link-outlook/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const authorizationUrl = oauthProvider.getAuthUrl(userId);
    res.redirect(authorizationUrl);
});

router.get('/outlook/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const userId = req.query.state as string;

    try {
        const {access_token,refresh_token,expires_in} = await oauthProvider.getTokenFromCode(code);
        const userData = await oauthProvider.getUserInfo(access_token);

        const tokenExpires = new Date(Date.now() + (parseInt(expires_in) - 300) * 1000);

        const userPayload:UserUpdate={
            oauth_provider_type:"OutLook",
            oauth_email:userData.mail,
            access_token,
            refresh_token,
            expires_in:tokenExpires

        }
        //await userService.updateUser(userId,userPayload);
        //const userMail= await oauthProvider.getUserMail(access_token);
        await oauthProvider.subscribeToOutlookWebhook(access_token);
        res.json({ 
            userMail:{},
            message: 'Outlook account linked successfully' 
        });
    } catch (error) {
        //console.log(error);
        res.status(500).json({ 
            errors:error,
            error: 'Error linking Outlook account' 
        });
    }
});

export default router;
