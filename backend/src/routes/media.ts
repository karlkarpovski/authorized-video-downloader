import { Router } from "express";
import { validateAnalyzeRequest } from "../middleware/validateMediaRequest";
import { blockUnsafeUrls } from "../middleware/ssrfGuard";
import { analyzeMedia } from "../controllers/mediaController";
import { asyncHandler } from "../utils/asyncHandler";

export const mediaRouter = Router();

mediaRouter.post("/analyze", validateAnalyzeRequest, blockUnsafeUrls, asyncHandler(analyzeMedia));