const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();

const redirectUri = 'http://localhost:3000/auth/outlook/callback';
const tenant = 'common';
const tenantId = '';

const clientId = '';
const clientSecret = '';

const authorizationUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;
const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
// Include Mail.Read in the scope
const scope = 'User.Read Mail.Read';

app.get('/', (req, res) => {
    const authUrl = `${authorizationUrl}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}`;
    res.redirect(authUrl);
});

app.get('/auth/outlook/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post(tokenUrl, qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = tokenResponse.data.access_token;

        // Get the user profile
        const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Get the user messages
        const messagesResponse = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.json({
            user: userResponse.data,
            messages: messagesResponse.data.value, // Assuming you only need the messages array
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
