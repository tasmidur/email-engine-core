import { NextFunction, Request, Response } from 'express';

interface Error {
    message: string;
    status: number;
}

const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        res.status((err as any)?.status || 500).send({ message: err.message });
    } else {
        console.error('Unknown error occurred');
        res.status(500).send({ message: 'An unknown error occurred' });
    }
};

export default ErrorMiddleware;