import { Request, Response } from 'express';
export declare const getNotifications: (req: Request, res: Response) => Promise<void>;
export declare const markNotificationAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAllNotificationsAsRead: (req: Request, res: Response) => Promise<void>;
export declare const deleteNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNotificationPreferences: (req: Request, res: Response) => Promise<void>;
export declare const updateNotificationPreferences: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUnreadNotificationCount: (req: Request, res: Response) => Promise<void>;
export declare const createNotification: (userId: string, type: string, title: string, message: string, data?: any) => Promise<any>;
//# sourceMappingURL=notificationController.d.ts.map