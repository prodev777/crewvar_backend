import { Request, Response } from 'express';
export declare const getReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getReportById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateReportStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSuspiciousActivities: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getModerationStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const performModerationAction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=moderationController.d.ts.map