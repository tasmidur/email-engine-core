# Backend Web Developer Take-Home Challenge: Email Engine Core

## The Challenge:
Your task is to develop a core system for an email client with essential
functionalities. This system will connect with user email accounts (initially
focusing on Outlook) and manage email data efficiently.

## Remarkable Challenge
Continuously monitor for changes in user email data (e.g., moved
emails, read/unread status, flags, deletions, new emails) even during
the initial sync.

# Solution

Step 1: Steps to Access User Messages from Outlook

Go to Azure Portal:
1. Navigate to the [Azure Portal](https://portal.azure.com/)
2. Go to "Azure Active Directory" > "App registrations" > Press New Registration button for app registration
3. Set Delegated type API Permissions : `Mail.Read`,`offline_access`,`openid`,`profile`,`User.Read`,

## Project Setup:
Pull from git:

```bash
  https://github.com/tasmidur/email-engine-core.git
```
## Backend Setup:
The backend api expose by port:3000

Modify env file:

```bash
# Application URL
# The base URL of the application
APP_URL=http://localhost:3000

# Server Port
# The port number the server will listen on
PORT=3000

# Socket Port
# The port number for socket.io connections
SOCKET_PORT=3019

# Frontend App URL
# The URL of the frontend application
FRONTEND_APP_URL=http://localhost:3001

# Outlook Client ID from registered app
# The client ID for Outlook OAuth authentication
OUTLOOK_CLIENT_ID=your_outlook_client_id

# Outlook Client Secret from registered app
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret

# Outlook Tenant ID from registered app
# The tenant ID for Outlook OAuth authentication
OUTLOOK_TENANT_ID=your_outlook_tenant_id

# Outlook Tenant from registered app
# The tenant type for Outlook OAuth authentication (common or tenant ID)
OUTLOOK_TENANT=common

# Set a Outlook Redirect URL to registered app
# The URL to redirect to after Outlook OAuth authentication
OUTLOOK_REDIRCT_URL=http://localhost:8080/auth/outlook/callback

# Set Session Secret Key by the command `cd api && yarn run session:secret`
SESSION_SECRET_KEY=your_session_secret_key

# Set JWT Secret Key by the command `cd api && yarn run jwt:secret`
JWT_SECRET=your_jwt_secret

# Set ENCRYPTION Secret Key by the command `cd api && yarn run crypto:secret`
ENCRYPTION_KEY=your_encryption_key

# Access Token Expiry
# The duration of access tokens in days (e.g. 1d, 7d, 30d)
ACCESS_TOKEN_EXPIRY=1d

# Refresh Token Expiry
# The duration of refresh tokens in days (e.g. 1d, 7d, 30d)
REFRESH_TOKEN_EXPIRY=1d

# Notification Handler URL
# The URL of the notification handler service
# For local environment you can use  `docker run -it -e NGROK_AUTHTOKEN=<token> ngrok/ngrok http 3000` for real #ip becuase it's listen without real ip.
NOTIFICATION_HANDLER_URL=https://your-notification-handler-url.com

# Elasticsearch Host
# The URL of the Elasticsearch instance
ELASTICSEARCH_HOST=http://elasticsearch:9200
```

## Frontend

The frontend expose by the port: 3001

modify env:

```bash
# Application Name
NEXT_PUBLIC_APP_NAME=MailBox

# Application Version
NEXT_PUBLIC_APP_VERSION=1.0.0

# Application Environment
NEXT_PUBLIC_APP_ENV=local

# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Finally Run by docker

```bash 
docker-compose up --build
```
