// ============================================================
// d:\ABHAYA\backend\src\middleware\errorHandler.ts
// Global Express error handler
// ============================================================

import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  errors?: unknown[];
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`❌ [Error] ${req.method} ${req.path} — ${statusCode}: ${err.message}`);
  if (isDev) console.error(err.stack);

  const response: Record<string, unknown> = {
    success: false,
    message: err.message || 'An unexpected error occurred',
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (isDev) {
    response.stack = err.stack;
    response.path = req.path;
    response.method = req.method;
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}

export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}
