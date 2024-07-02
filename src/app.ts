// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import { config as dotenvConfig } from 'dotenv'
// Load environment variables from .env file
dotenvConfig()

const app = express();

app.use(bodyParser.json());
app.use('/auth', authRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`call: http://localhost:3000/auth/link-outlook/3VLSY5ABhilYgBDjCHzY`);
    
    console.log(`Server is running on http://localhost:${PORT}`);
});
