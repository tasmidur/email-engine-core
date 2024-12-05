# Email Engine Core
The system is for an email client with essential functionalities. This system will connect with user email accounts (initially focusing on Outlook) and manage email data efficiently.

## Remarkable Challenge
Continuously monitor for changes in user email data (e.g., moved emails, read/unread status, flags, deletions, new emails) even during the initial sync.

## Solution

### Step 1: Access User Messages from Outlook

Go to Azure Portal:
1. Navigate to the [Azure Portal](https://portal.azure.com/)
2. Go to "Azure Active Directory" > "App registrations" > Press New Registration button for app registration
3. Set Delegated type API Permissions: `Mail.Read`, `offline_access`, `openid`, `profile`, `User.Read`

### Project Setup
Clone the repository:

```bash
git clone https://github.com/tasmidur/email-engine-core.git
```

### Backend Setup
The backend API is exposed on port 3000.
Navigate to api directory and copy .env.example to .env and modify the `.env` according to the below

```bash
# Application URL
APP_URL=http://localhost:3000

# Server Port
PORT=3000

# Socket Port
SOCKET_PORT=3019

# Frontend App URL
FRONTEND_APP_URL=http://localhost:3001

# Outlook OAuth Credentials
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
OUTLOOK_TENANT_ID=your_outlook_tenant_id
OUTLOOK_TENANT=common
OUTLOOK_REDIRECT_URL=http://localhost:8080/auth/outlook/callback

# Session Secret Key
SESSION_SECRET_KEY=your_session_secret_key

# JWT Secret Key
JWT_SECRET=your_jwt_secret

# Encryption Key
ENCRYPTION_KEY=your_encryption_key

# Token Expiry Durations
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=1d

# Notification Handler URL
NOTIFICATION_HANDLER_URL=https://your-notification-handler-url.com

# Elasticsearch Host
ELASTICSEARCH_HOST=http://elasticsearch:9200
```

### Note:
For local environments, you can use Ngrok to set a real IP address for the notification handler:

```bash
docker run -it -e NGROK_AUTHTOKEN=<token> ngrok/ngrok http 3000
```
## Now Install the dependency and build
```bash
cd email-engine-core/api
yarn
yarn run build
```

### Frontend Setup

The frontend is exposed on port 3001.
Navigate to frontend directory and copy .env.example to .env and modify the `.env` according to the below


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

## Now Install the dependency and build
```bash
cd email-engine-core/frontend
yarn
yarn run build
```

### Running the Project
init
To run the project using Docker:

```bash 
docker-compose up --build
```
