/**
 * Importing necessary modules
 */
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * SessionMiddleware function
 * Verifies the JWT token in the Authorization header and sets the user object on the request
 */
export const SessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    /**
     * Getting the Authorization header from the request
     */
    const authHeader = req.headers.authorization;

    /**
     * If the Authorization header is present, extract the token
     */
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        /**
         * Verify the token using the JWT secret
         */
        jwt.verify(token, (process.env.JWT_SECRET || ''), (err: any, payload: any) => {
            /**
             * If the token is invalid, return a 403 Forbidden response
             */
            if (err) {
                return res.sendStatus(403);
            }

            /**
             * If the token is valid, set the user object on the request
             */
            console.log('payload', payload);
            (req as any).user = {
                id: payload?.id,
                username: payload?.username,
            };

            /**
             * Call the next middleware function
             */
            next();
        });
    } else {
        /**
         * If the Authorization header is not present, return a 401 Unauthorized response
         */
        res.sendStatus(401);
    }
};