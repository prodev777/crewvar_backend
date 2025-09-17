import { Request, Response } from 'express';
export declare const getCruiseAssignments: (req: Request, res: Response) => Promise<void>;
export declare const getCalendarEvents: (req: Request, res: Response) => Promise<void>;
export declare const createCruiseAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCruiseAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCruiseAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCalendarEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCurrentAssignment: (req: Request, res: Response) => Promise<void>;
export declare const getUpcomingAssignments: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=calendarController.d.ts.map