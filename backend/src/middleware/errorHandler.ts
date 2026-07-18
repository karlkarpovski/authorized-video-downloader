import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : "Unexpected server error.";

  // Log method, path, and error detail server-side only — deliberately
  // NOT req.body, since it contains the user's submitted URL and we
  // don't want URLs (which can carry tokens/query params) sitting in
  // plaintext logs any longer than necessary.
  console.error(`[error] ${req.method} ${req.path}:`, err);

  res.status(statusCode).json({ error: message });
}