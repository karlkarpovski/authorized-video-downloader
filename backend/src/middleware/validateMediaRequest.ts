import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";
import { isWellFormedHttpUrl } from "../utils/validateUrl";
import { ALLOWED_FORMATS, ALLOWED_QUALITIES } from "../types/media";

export function validateAnalyzeRequest(req: Request, _res: Response, next: NextFunction) {
  const { url, permissionConfirmed } = req.body ?? {};

  if (url === undefined) {
    return next(new AppError("Field 'url' is required."));
  }
  if (!isWellFormedHttpUrl(url)) {
    return next(new AppError("Field 'url' must be a valid http:// or https:// URL."));
  }
  if (permissionConfirmed !== true) {
    return next(new AppError("You must confirm permission to download this content."));
  }

  next();
}

export function validateDownloadRequest(req: Request, _res: Response, next: NextFunction) {
  const { url, permissionConfirmed, format, quality } = req.body ?? {};

  if (url === undefined) {
    return next(new AppError("Field 'url' is required."));
  }
  if (!isWellFormedHttpUrl(url)) {
    return next(new AppError("Field 'url' must be a valid http:// or https:// URL."));
  }
  if (permissionConfirmed !== true) {
    return next(new AppError("You must confirm permission to download this content."));
  }
  if (!ALLOWED_FORMATS.includes(format)) {
    return next(new AppError(`Field 'format' must be one of: ${ALLOWED_FORMATS.join(", ")}.`));
  }
  if (!ALLOWED_QUALITIES.includes(quality)) {
    return next(new AppError(`Field 'quality' must be one of: ${ALLOWED_QUALITIES.join(", ")}.`));
  }

  next();
}