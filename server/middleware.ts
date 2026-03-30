import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { findUserByEmail } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'qa-generator-secret-key-2026';

// Auth middleware — sets req.user with uid, email, role
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role-check helper: loads full user from DB to get role, then checks against allowed roles
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decoded = (req as any).user;
      if (!decoded?.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const user = await findUserByEmail(decoded.email);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      const role = user.role || 'viewer';
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'You do not have permission to perform this action' });
      }
      (req as any).userRole = role;
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}
