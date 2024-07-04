// src/routes/auth.ts
import {Router, Request, Response} from 'express';
import {UserService} from '../services/UserService';
import {OutlookOAuthProvider} from '../providers/OutlookOAuthProvider';
import {User, UserUpdate} from '../models/User';
import {MessageService} from "../services/MessageService";

const router = Router();
const userService = new UserService();
const messageService = new MessageService();
const oauthProvider = new OutlookOAuthProvider();

router.post('/register', async (req: Request, res: Response) => {
    const {username, password} = req.body;
    const response = await userService.createUser(username, password);

    if (response.status !== 200) {
        return res.status(500).json(response);
    }

    const jwtToken = userService.generateJwt({
        id: response.data.id,
        username: response.data.username
    });
    res.json({
        status: 200,
        message: 'User created successfully',
        data: {
            id: response.data.id,
            username: response.data.username,
            token: jwtToken
        }
    });
});


router.post('/link-outlook/:userId', async (req: Request, res: Response) => {
    const {oauth_email, oauth_provider_type, oauth_refresh_token} = req.body;
    const {userId} = req.params;
    const userPayload: any = {
        oauth_email,
        oauth_provider_type,
        oauth_refresh_token
    }

    try {
        const user = await userService.updateUser(userId, userPayload);
        res.json({
            user_id: user,
        });
    } catch (error) {
        res.status(500).json({error: 'Error creating user'});
    }
});

router.post('/webhook', (req, res) => {
    console.log('Received webhook notification:', req.body);
    res.status(200).send('OK');
});


router.get('/link-outlook/:userId', (req: Request, res: Response) => {
    const {userId} = req.params;
    const authorizationUrl = oauthProvider.getAuthUrl(userId);
    res.redirect(authorizationUrl);
});

router.get('/outlook/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const userId = req.query.state as string;

    try {
        const {access_token, refresh_token, expires_in} = await oauthProvider.getTokenFromCode(code);
        const userData = await oauthProvider.getUserInfo(access_token);
        const tokenExpires = new Date(Date.now() + (parseInt(expires_in) - 300) * 1000);

        const userPayload: UserUpdate = {
            providerType: "outlook",
            emailAddress: userData.mail,
            displayName: userData.displayName,
            identityKey: userData.id,
            accessToken: access_token || '',
            refreshToken: refresh_token || '',
            expireIn: tokenExpires || new Date(),
            updateAt: new Date()
        }

        //const userDetail = await userService.updateUser(userId, userPayload);

        //const userMail = await oauthProvider.getUserMail(access_token);
        // await oauthProvider.subscribeToOutlookWebhook(access_token);

        const syncMessages = await oauthProvider.syncAllMessages(access_token);

        //const syncMessageToEs=await messageService.syncMessages(syncMessages);

        res.json({
            userData,
            //syncMessageToEs,
            userMail: syncMessages,
            message: 'Outlook account linked successfully'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            errors: error,
            error: 'Error linking Outlook account'
        });
    }
});

export default router;
