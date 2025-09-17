import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadProfilePhoto: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadAdditionalPhoto: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePhoto: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=uploadController.d.ts.map