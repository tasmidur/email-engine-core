import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


export const SessionMiddleware=async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, (process.env.JWT_SECRET||''), (err:any,payload:any) => {
        if (err) {
          return res.sendStatus(403);
        }
        return payload;
      });
    } else {
      res.sendStatus(401);
    }
  };