const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@microsoft/microsoft-graph-client');
const { InteractiveBrowserCredential } = require('@azure/identity');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const port = 3000;

const webhookUrl="https://bc42-160-238-33-8.ngrok-free.app"

const tenantId = '';

const clientId = '';
const clientSecret = '';

const redirectUri = 'http://localhost:3000/auth/outlook/callback'; // Redirect URI for interactive login
const scopes = ['user.read', 'mail.read', 'mail.readwrite']; // Add required scopes

const credential = new InteractiveBrowserCredential({
  clientId: clientId,
  tenantId: "common",
  redirectUri: redirectUri,
  scopes: scopes,
});

const client = Client.initWithMiddleware({
  authProvider: {
      getAccessToken: async () => {
      const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
      return tokenResponse.token;
    },
  },
});

// Subscribe to webhook notifications
async function subscribeToWebhook() {
  try {
    const subscription = {
      changeType: 'created,updated',
      notificationUrl: `${webhookUrl}/notifications`, // Replace with your publicly accessible webhook URL
      resource: '/me/messages',
      expirationDateTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      clientState: 'randomClientState',
    };
    

    const response = await client.api('/subscriptions').post(subscription);
    console.log('Subscription created:', response);
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

// Endpoint to handle webhook validation and notifications
app.post('/notifications', (req, res) => {
  if (req.query && req.query.validationToken) {
    res.send(req.query.validationToken);
    return;
  }

  const { value } = req.body;
  value.forEach(notification => {
    console.log('Notification received:', notification);

    // Handle email processing here, e.g., fetching email details and processing
  });

  res.sendStatus(202);
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

app.get('/mails', async (req, res) => {
  try {
    const messages = await client.api('/me/messages').get();
    res.json(messages.value);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  subscribeToWebhook();
});
