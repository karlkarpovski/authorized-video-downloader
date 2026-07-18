import { Router } from "express";
import { validateDownloadRequest } from "../middleware/validateMediaRequest";
import { blockUnsafeUrls } from "../middleware/ssrfGuard";
import { createJobLimiter } from "../middleware/rateLimit";
import { createDownloadJob, getJobStatus, getJobFile } from "../controllers/jobsController";

export const jobsRouter = Router();

jobsRouter.post("/", createJobLimiter, validateDownloadRequest, blockUnsafeUrls, createDownloadJob);
jobsRouter.get("/:jobId", getJobStatus);
jobsRouter.get("/:jobId/file", getJobFile);