import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    username: string;
  };
}

const getAuthService = () => (global as any).authService;

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const verification = getAuthService().verifyToken(token);

  if (!verification.valid) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  req.user = { username: verification.username! };
  next();
};
