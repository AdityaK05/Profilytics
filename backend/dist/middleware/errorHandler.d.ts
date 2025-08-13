import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}
declare class CustomError extends Error implements AppError {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const catchAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: (message: string, statusCode?: number) => CustomError;
export { CustomError };
//# sourceMappingURL=errorHandler.d.ts.map