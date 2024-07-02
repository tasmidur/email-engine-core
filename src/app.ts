// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("ev",process.env.PORT)

const app = express();

app.use(bodyParser.json());
app.use('/auth', authRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
