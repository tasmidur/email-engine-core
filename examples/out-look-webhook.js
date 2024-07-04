const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const port = 3002;

const webhookUrl = "https://4a67-202-74-245-225.ngrok-free.app"
const accessToken="EwB4A8l6BAAUbDba3x2OMJElkF7gJ4z/VbCPEz0AAXrX2YnSBnzcxtwr8PB7jUtnug02GMo9jX6R+ARS11CJthjsSjVw2fgjWsqIbTcsxP4yqWFyypH/9jjfvp8HyJne9Bhr5Kw+IntuK97zO/oPPROb2pcLs6s/gS86744zjkrMHZ0dJre/borz3SZiqnom7tA4eXgCkc256E1bENMr/enSzajrYQwF/f9F7ypkKFCQ5KigPYv7FW6o+nWKv7Cx63A0sUcAqBkbxpK2Pc1r2q8xeQyMSiPdXL0WKCL9ShNDQSmTVISwl2p24Z7/aMnbSPdxPqmyE68QfM+UAjVR4qQEMdIJN26eiZZ87TIzLNCejYsnBZglVzbTmn262UIDZgAACFFiIGpl9rKOSAKRIDxVl6RCGMS3+GHpmH4eJNzYxAWMIVRRM0nE4/VKJZn7MJV9HjxHMGASpKeHDxgIYVgSueD63vceKOAcgSQlxYJXjmbr4BcH2oiBSgzaw+DNRKBMmeD9IAxxucIm81AtZbV9oYczEGG6zz2QMycr2rd27bWE2GK466IGJhhRclbiAE53cyDyYWB4DEI1hv2dbzO7LFfKUeXmUoqGqsdLnGwZMS2ZqfAmqsZqWHAmVpU3kbnDcGrWp30eJaTidjCshym0RTReMCnZQRWZDof5sAxx6O5C+0oMbMzvPA2svyvBOqi9h9grXK9iwjP1qKR6952vLpnJXuE4It1Ofqvb7UG0ZWHMnAhByjqDxxO6/tkqBsw+PZJlLktS3iYbHmqWFAKflFpHBgsoh33rHUIRmVBJnzjDRrGpFvJeyu+K9r4jeKHqNUPSy6uzSuxSoQRiRZ+nH9jlNOLfphhh51l/fi2V4DU+eqrfoL9Yu1nx73nBvETQjBfhZUQgi0LioTAzIct6hV/JsBHy5ZPKzwhww6wJnbxuSh3M+XEXO6F1unwQ/8hQ/J1iD5SWSh6tTmqm6ZO3STdoBhon+szBsMlv8sE+ijOynuIha4vYcgWF05wQdM27B2d6YZ/Mxa9z9uBC+N5HqT56ecwhD+99LQluv6WXMA0P5QpKa0o3y6hQkUspDoh5yIxcfSyqs671XuGkQzs/bZjV28kf0RN0kRrN3VNkIWDfJqeKOraHeqa6l6U1mLZu0KJMjwcVA9JJb8iV+lMbo7snWY8C"

// Subscribe to webhook notifications
async function subscribeToWebhook() {
    try {

        const subscription = {
            changeType: 'created,updated,deleted,moved',
            notificationUrl: `${webhookUrl}/notifications`,
            resource: '/me/messages',
            expirationDateTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        };


        const response = await axios.post('https://graph.microsoft.com/v1.0/subscriptions', subscription, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
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
