import { Request, Response } from 'express';
export declare const sendConnectionRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingRequests: (req: Request, res: Response) => Promise<void>;
export declare const respondToConnectionRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getConnections: (req: Request, res: Response) => Promise<void>;
export declare const removeConnection: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkConnectionStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendConnectionRequestValidation: import("express-validator").ValidationChain[];
export declare const respondToConnectionRequestValidation: import("express-validator").ValidationChain[];
//# sourceMappingURL=connectionController.d.ts.map