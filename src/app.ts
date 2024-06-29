// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use('/auth', authRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
