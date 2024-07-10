const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append('client_id', process.env.OUTLOOK_CLIENT_ID);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', process.env.OUTLOOK_CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');

  const response = await axios.post(
    `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data.access_token;
};

const createSubscription = async (accessToken) => {
  const response = await axios.post(
    'https://graph.microsoft.com/v1.0/subscriptions',
    {
      changeType: 'created,updated,deleted,moved',
      notificationUrl: 'https://your-ngrok-url/webhook',
      resource: '/me/messages',
      expirationDateTime: '2024-12-31T18:23:45.9356913Z',
      clientState: 'your_client_state'
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

app.post('/webhook', (req, res) => {
  if (req.query.validationToken) {
    res.send(req.query.validationToken);
  } else {
    console.log('Received webhook event:', req.body);
    res.status(202).send();
    handleMailEvent(req.body.value);
  }
});

const handleMailEvent = (events) => {
  events.forEach((event) => {
    const { changeType, resourceData } = event;
    switch (changeType) {
      case 'created':
        console.log('Email created:', resourceData);
        break;
      case 'updated':
        console.log('Email updated:', resourceData);
        break;
      case 'deleted':
        console.log('Email deleted:', resourceData);
        break;
      case 'moved':
        console.log('Email moved:', resourceData);
        break;
      default:
        console.log('Unhandled event type:', changeType);
    }
  });
};

app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  try {
    const accessToken = await getAccessToken();
    const subscription = await createSubscription(accessToken);
    console.log('Subscription created:', subscription);
  } catch (error) {
    console.error('Error creating subscription:', error.response.data);
  }
});
