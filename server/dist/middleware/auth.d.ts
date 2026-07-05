import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types';
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export declare const verifyToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (...roles: JwtPayload["role"][]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const signToken: (payload: JwtPayload) => string;
//# sourceMappingURL=auth.d.ts.map