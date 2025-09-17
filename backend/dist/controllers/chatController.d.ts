import { Request, Response } from 'express';
export declare const getChatRooms: (req: Request, res: Response) => Promise<void>;
export declare const getChatMessages: (req: Request, res: Response) => Promise<void>;
export declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMessageStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateOnlineStatus: (req: Request, res: Response) => Promise<void>;
export declare const getUserOnlineStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=chatController.d.ts.map