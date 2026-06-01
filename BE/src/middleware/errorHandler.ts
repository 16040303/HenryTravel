import type { NextFunction, Request, Response } from 'express';
import { isAppError } from '../utils/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (isAppError(error)) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
    });
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' ? { details: message } : {}),
  });
}
