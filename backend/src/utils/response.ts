// ============================================================
// d:\ABHAYA\backend\src\utils\response.ts
// Standardised API response helpers
// ============================================================

import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: unknown[]
): Response {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): Response {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
