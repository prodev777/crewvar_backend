import { Request, Response } from 'express';
export declare const getUserProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUserProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProfileDetails: (req: Request, res: Response) => Promise<void>;
export declare const updateProfileValidation: import("express-validator").ValidationChain[];
export declare const updateShipAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProfileDetailsValidation: import("express-validator").ValidationChain[];
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map