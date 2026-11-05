// ============================================================
// d:\ABHAYA\backend\src\middleware\validate.ts
// Express-validator result checker middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err: ValidationError) => ({
      field: err.type === 'field' ? (err as { path: string }).path : 'unknown',
      message: err.msg,
    }));
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    });
    return;
  }
  next();
}
