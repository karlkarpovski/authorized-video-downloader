import { validateAnalyzeRequest, validateDownloadRequest } from "./validateMediaRequest";
import { AppError } from "./errorHandler";
import type { Request, Response, NextFunction } from "express";

function mockReq(body: unknown): Request {
  return { body } as Request;
}

function callMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  body: unknown
): unknown {
  const next = jest.fn();
  middleware(mockReq(body), {} as Response, next);
  return next.mock.calls[0]?.[0];
}

describe("validateAnalyzeRequest", () => {
  it("passes through valid input", () => {
    const err = callMiddleware(validateAnalyzeRequest, {
      url: "https://example.com/video",
      permissionConfirmed: true,
    });
    expect(err).toBeUndefined();
  });

  it("rejects a missing URL", () => {
    const err = callMiddleware(validateAnalyzeRequest, { permissionConfirmed: true });
    expect(err).toBeInstanceOf(AppError);
  });

  it("rejects an invalid URL", () => {
    const err = callMiddleware(validateAnalyzeRequest, { url: "not-a-url", permissionConfirmed: true });
    expect(err).toBeInstanceOf(AppError);
  });

  it("rejects when permission is not confirmed", () => {
    const err = callMiddleware(validateAnalyzeRequest, {
      url: "https://example.com/video",
      permissionConfirmed: false,
    });
    expect((err as AppError).message).toMatch(/permission/i);
  });
});

describe("validateDownloadRequest", () => {
  const validBody = {
    url: "https://example.com/video",
    permissionConfirmed: true,
    format: "MP4",
    quality: "720p",
  };

  it("passes through valid input", () => {
    expect(callMiddleware(validateDownloadRequest, validBody)).toBeUndefined();
  });

  it("rejects an invalid format", () => {
    const err = callMiddleware(validateDownloadRequest, { ...validBody, format: "AVI" });
    expect((err as AppError).message).toMatch(/format/i);
  });

  it("rejects an invalid quality", () => {
    const err = callMiddleware(validateDownloadRequest, { ...validBody, quality: "4000p" });
    expect((err as AppError).message).toMatch(/quality/i);
  });

  it("rejects a missing permission confirmation", () => {
    const err = callMiddleware(validateDownloadRequest, { ...validBody, permissionConfirmed: undefined });
    expect((err as AppError).message).toMatch(/permission/i);
  });
});