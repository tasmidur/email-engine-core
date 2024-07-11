/**
 * Importing necessary modules
 */
import { NextFunction, Request, Response } from 'express';

/**
 * ErrorMiddleware function
 * Catches and handles any errors that occur in the middleware stack
 *
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 * @param {NextFunction} next - The next middleware function in the stack
 */
export const ErrorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    /**
     * Try to call the next middleware function
     */
    try {
        next();
    } catch (error: any) {
        /**
         * If an error occurs, log it to the console
         */
        console.log("error", error);

        /**
         * Return a 500 Internal Server Error response with a JSON message
         */
        res.status(500).json({ message: 'Internal Server Error' });
    }
};