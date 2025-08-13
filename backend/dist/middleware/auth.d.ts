import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const restrictTo: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireEmailVerification: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireStudentProfile: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireEmployerProfile: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVerifiedEmployer: (req: Request, res: Response, next: NextFunction) => void;
export declare const sensitiveOperationLimit: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    restrictTo: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
    requireEmailVerification: (req: Request, res: Response, next: NextFunction) => void;
    requireStudentProfile: (req: Request, res: Response, next: NextFunction) => void;
    requireEmployerProfile: (req: Request, res: Response, next: NextFunction) => void;
    requireVerifiedEmployer: (req: Request, res: Response, next: NextFunction) => void;
    sensitiveOperationLimit: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map