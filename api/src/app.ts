/**
 * The main application file
 */

import express, {Request, Response, NextFunction} from 'express'; // Import Express.js framework
import bodyParser from 'body-parser'; // Import body-parser middleware
import authRoutes from './routes/auth'; // Import authentication routes
import messageRouters from './routes/message'; // Import message routes
import cors from 'cors'; // Import CORS middleware
import * as dotenv from 'dotenv'; // Import dotenv module
import {scheduleCronJob} from './cron'; // Import scheduleCronJob function
import {UserService} from './services/UserService'; // Import UserService
import {OutlookOAuthProvider} from './providers/OutlookOAuthProvider'; // Import OutlookOAuthProvider
import {ElasticSearchClient} from './elasticSearchClient'; // Import ElasticSearchClient
import {UserSchema} from './models/User'; // Import UserSchema
import {MessageSchema} from './models/Message'; // Import MessageSchema
import {MailBoxSchema} from './models/MailBox'; // Import MailBoxSchema
import {ErrorMiddleware} from './middleware/ErrorMiddleware'; // Import ErrorMiddleware

/**
 * Load environment variables from .env file
 */
dotenv.config();

/**
 * Create an instance of the Express app
 */
const app: express.Application = express();

/**
 * Enable CORS
 */
app.use(cors());

/**
 * Parse JSON bodies
 */
app.use(bodyParser.json());

/**
 * Mount authentication routes
 */
app.use('/auth', authRoutes);

/**
 * Mount message routes
 */
app.use('/messages', messageRouters);

/**
 * Use error middleware
 */
app.use(ErrorMiddleware);

/**
 * Get the port from environment variables or default to 3000
 */
const PORT: number = Number(process.env.PORT) || 3000;

/**
 * Start the server
 */
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

/**
 * Create an instance of the OutlookOAuthProvider
 */
const oauthProvider: OutlookOAuthProvider = new OutlookOAuthProvider();

/**
 * Create an instance of the UserService
 */
const userService: UserService = new UserService();

/**
 * Initialize Elasticsearch with the UserSchema, MessageSchema, and MailBoxSchema
 */
(new ElasticSearchClient()).initElasticsearch([
    UserSchema,
    MessageSchema,
    MailBoxSchema
]).then((res: any) => console.log("Elasticsearch initialized")).catch((err: any) => console.log(err));

/**
 * Schedule a cron job to sync users every minute
 */
const cronExpression: string = `* * * * *`;
scheduleCronJob(cronExpression, async () => {
    userService.syncUsers(oauthProvider).then((res: any) => console.log("user sync........")).catch((err: any) => console.log(err))
}).then((res: any) => console.log("Cron Job Scheduled")).catch((err: any) => console.log("Error:Cron Job", err));