// ============================================================
// d:\ABHAYA\backend\src\middleware\auth.ts
// JWT authentication and role-based authorization middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types';
import { isTokenBlacklisted } from '../config/redis';
import { sendError } from '../utils/response';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No authorization token provided', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 'Malformed authorization header', 401);
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      sendError(res, 'Server configuration error', 500);
      return;
    }

    // Check token blacklist (logout)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      sendError(res, 'Token has been revoked. Please login again.', 401);
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token has expired. Please login again.', 401);
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid token', 401);
      return;
    }
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        403
      );
      return;
    }
    next();
  };
}

// Optional auth — attaches user if token present, doesn't fail if absent
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (secret && token) {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        req.user = decoded;
      }
    }
  } catch {
    // ignore — optional auth
  }
  next();
}
