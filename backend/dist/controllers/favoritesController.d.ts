import { Request, Response } from 'express';
export declare const getFavorites: (req: Request, res: Response) => Promise<void>;
export declare const addFavorite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeFavorite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkFavoriteStatus: (req: Request, res: Response) => Promise<void>;
export declare const getFavoriteAlerts: (req: Request, res: Response) => Promise<void>;
export declare const getUnreadAlertsCount: (req: Request, res: Response) => Promise<void>;
export declare const markAlertAsRead: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=favoritesController.d.ts.map