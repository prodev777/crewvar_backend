import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifyEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const resendVerification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const registerValidation: import("express-validator").ValidationChain[];
export declare const loginValidation: import("express-validator").ValidationChain[];
//# sourceMappingURL=authController.d.ts.map