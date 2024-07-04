// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import messageRouters from './routes/message';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use('/auth', authRoutes);
app.use('/message', messageRouters);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
