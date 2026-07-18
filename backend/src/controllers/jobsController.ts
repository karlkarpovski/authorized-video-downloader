import type { Request, Response } from "express";
import { createJob, getJob, hasCapacityForNewJob, JOB_ID_PATTERN } from "../services/downloadJobs";
import { runDownloadJob } from "../services/jobRunner";
import { AppError } from "../middleware/errorHandler";
import type { DownloadRequestBody, JobStatusResponseBody, CreateJobResponseBody } from "../types/media";

export function createDownloadJob(
  req: Request<unknown, unknown, DownloadRequestBody>,
  res: Response<CreateJobResponseBody>
) {
  if (!hasCapacityForNewJob()) {
    throw new AppError("Server is busy with other downloads. Try again shortly.", 429);
  }

  const { url, format, quality } = req.body;
  const job = createJob();

  res.status(202).json({
    jobId: job.id,
    status: job.status,
    statusText: job.statusText,
    expiresAt: new Date(job.expiresAt).toISOString(),
  });

  // Response already sent above — this runs in the background.
  // The client finds out how it went by polling GET /api/jobs/:jobId.
  void runDownloadJob(job.id, url, format, quality);
}

export function getJobStatus(req: Request, res: Response<JobStatusResponseBody>) {
  const jobId = req.params.jobId as string;
  if (!JOB_ID_PATTERN.test(jobId)) {
    throw new AppError("Invalid job id.", 404);
  }

  const job = getJob(jobId);
  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  res.status(200).json({
    jobId: job.id,
    status: job.status,
    percent: job.percent,
    statusText: job.statusText,
    failureReason: job.failureReason,
    filename: job.filename,
    downloadUrl: job.status === "completed" ? `/api/jobs/${job.id}/file` : undefined,
    expiresAt: new Date(job.expiresAt).toISOString(),
  });
}

export function getJobFile(req: Request, res: Response) {
  const jobId = req.params.jobId as string;
  if (!JOB_ID_PATTERN.test(jobId)) {
    throw new AppError("Invalid download link.", 404);
  }

  const job = getJob(jobId);
  if (!job) {
    throw new AppError("This download link has expired or does not exist.", 404);
  }
  if (job.status !== "completed" || !job.filePath || !job.filename) {
    throw new AppError("This job isn't finished yet.", 409);
  }

  res.download(job.filePath, job.filename, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: "Failed to send file." });
    }
  });
}