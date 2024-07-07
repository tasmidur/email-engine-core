// src/app.ts
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import messageRouters from './routes/message';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET_KEY || '',  // replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to true if using https
      maxAge: 60000 // Cookie expiration time in milliseconds
    }
  }));
  
app.use('/auth', authRoutes);
app.use('/messages', messageRouters);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`call: http://localhost:3000/auth/link-outlook/3VLSY5ABhilYgBDjCHzY`);
    
    console.log(`Server is running on http://localhost:${PORT}`);
});
