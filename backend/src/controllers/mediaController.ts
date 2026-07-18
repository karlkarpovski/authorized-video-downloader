import type { Request, Response } from "express";
import type { AnalyzeRequestBody, AnalyzeResponseBody } from "../types/media";
import { analyzeMediaUrl } from "../services/mediaAnalysis";

export async function analyzeMedia(
  req: Request<unknown, unknown, AnalyzeRequestBody>,
  res: Response<AnalyzeResponseBody>
) {
  const result = await analyzeMediaUrl(req.body.url);
  res.status(200).json(result);
}