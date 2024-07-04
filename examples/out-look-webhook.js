const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const port = 3002;

const webhookUrl = "https://235f-202-74-245-225.ngrok-free.app"
const accessToken = "EwB4A8l6BAAUbDba3x2OMJElkF7gJ4z/VbCPEz0AAQJqQag1xDphiJNCee9zIFsyMXRLnP4ngyl39meTW7hK/+bf2+lNe0iW5eNX7B3hfQyR04vd881X2Rip7pstJp0rMtYurDOS086UbiUdmDgsaRKGPvOVMDXNNDZPHvXIG0fJy0SrYWvd7ovTW4fC3itO1mJas/48RXrfwunFWJ3ufaAZsDZZIQY+8yKfhnAiOFU0yTZVk4Gfsm05iPvPD7BdTYtgNy9aRtZ+lQ1Mj47c9pVglzzkBfuOXq4xbRKUNB09uUdb+wqBfg0Utvl/+ABSobjrD7vccpZK+VClw+x+ipWCXUR2yvTnZ92u4cOKH76wb1e4kIsmpj0sWU7Z2iQDZgAACASNo2N0cckSSAJOKSyQ/gOajFjXVr4J+CaZuEMShFlLq+ww4vAM2+71wQTziAOseX9McCKaJKdT1MPCgZOrMXHs0FrNOSl9vY3U6lE7lxeF7CWKy1YlFQlE/RewGWBvDXSL0o/KPz0aap/1A9tUmr4uY4xmZVA9YToYQLqt5zmrETi+JRMgaW2r5zR31up4PgO/WzYyBfp6h0Ysda4lW/xUboCwc8wkWJp9TXURE1nEhpeNpF6I5Y6qN/xqAvDhneTMAnOJPvt2kjLFdbtLXjauwn+zMNm+aah4defk/IRf0DIpfyTCyhrXPRatWOwmO91C/BhYJY4lw+UvIHOCAJPusj4pvaOUXPuaM1xR5b07l+hmt6bAM4eHywxK6u37ut8wbn75TwKJvPnYIEygsDnn6T4O2Wd4QLBwagFUXA5IA2S4luxlTGTmLDRebhE8DPah0jRkhhUAnlcsAYijwG8NzMWR+Wcq+m/mdz9tjbmRN5JNvzA7Wnl7AtSM1NiNHWN62eKS/8a9mq/ccDU9QfbxlyoiUSFWv5CFH19y5MUg3NVGr7hfShyoIHxVjDxl15IMs8WDKxcslUUadQJA1hDCudRRCQ3yLhTnnk//Dvd/RiOqJmBXSnao8GawwfNT3B3sfH1I5gVjjEm03jOs4Z8kpuRh4/K1UddVSR6e18c7CsJ0xUVhR6i1dG34dffoE046k/7VbVvbYO98dE62Zi/wX83/E8zAt3n/RZnY9lNd7fHPZtuPKebppZ2fi4+ghuwlzi6/CtoRJX1OVgqVvYk/oo8C";

// Subscribe to webhook notifications
async function subscribeToWebhook() {
    try {

        const subscription = {
            changeType: 'created,updated,deleted',
            notificationUrl: `${webhookUrl}/notifications`,
            resource: `/me/messages`, // Adding select clause to the query string
            expirationDateTime: new Date(new Date().getTime() + 3600 * 1000).toISOString(), // 1 hour from now
            lifecycleNotificationUrl: `${webhookUrl}/lifecycle`
        };


        const response = await axios.post('https://graph.microsoft.com/v1.0/subscriptions', subscription, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Subscription created:', response);
    } catch (error) {
        console.error('Error creating subscription:', JSON.stringify(error.response.data, null, 2));
    }
}

const renewSubscription = async (subscriptionId, retryCount = 0) => {
    const url = `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`;
    const config = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        data: {
            expirationDateTime: new Date(Date.now() + 3600 * 1000 * (86 + 1)).toISOString(), // Add 87 hours (1 hour buffer)
        }
    };

    try {
        const response = await axios(config);
        console.log('Subscription renewed successfully!');
    } catch (error) {
        if (retryCount < 2) {
            console.error(`Subscription renewal failed: ${error.message}`);
            console.log(`Retrying subscription renewal (attempt ${retryCount + 1})...`);
            setTimeout(() => renewSubscription(subscriptionId, retryCount + 1), 10000); // Retry after 10 seconds
        } else {
            console.error('Subscription renewal failed after retries. Consider manual intervention.');
            throw error; // Re-throw the error for potential handling (e.g., logging)
        }
    }
}

app.post('/lifecycle', async (req, res) => {
    try {
        const notification = req.body;

        console.log('Received lifecycle notification:', notification);

        // // Check the notification type
        // if (notification?.subscriptionExpirationWarning) {
        //     console.log('Subscription is nearing expiration. Renewing...');
        //     try {
        //         await renewSubscription(notification.subscriptionId);
        //         console.log('Subscription renewed successfully');
        //     } catch (error) {
        //         console.error('Subscription renewal failed:', error);
        //     }
        // } else if (notification?.subscriptionRevoked) {
        //     console.log('Subscription revoked:', notification.reason);
        //     // Your logic to handle revoked subscription (e.g., clean up resources)
        //     // (Revocation handling logic not included here for brevity)
        // }

        res.status(200).send();
    } catch (error) {
        console.error('Error processing lifecycle notification:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to handle webhook validation and notifications
app.post('/notifications', (req, res) => {
    if (req.query && req.query.validationToken) {
        res.send(req.query.validationToken);
        return;
    }

    const {value} = req.body;
    value.forEach(notification => {
        console.log('Notification received:', notification);

        // Handle email processing here, e.g., fetching email details and processing
    });

    res.sendStatus(202);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    subscribeToWebhook();
});
