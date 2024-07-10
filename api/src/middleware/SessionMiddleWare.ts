import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

export const SessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, (process.env.JWT_SECRET || ''), (err: any, payload: any) => {
            if (err) {
                return res.sendStatus(403);
            }
            console.log('payload', payload);
            (req as any).user = {
                id: payload?.id,
                username: payload?.username,
            };
            next();
        });
    } else {
        res.sendStatus(401);
    }
};