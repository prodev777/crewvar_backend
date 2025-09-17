import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        isAdmin: boolean;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=auth.d.ts.map