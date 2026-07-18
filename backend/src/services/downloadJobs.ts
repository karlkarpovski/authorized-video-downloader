import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import type { JobStatus } from "../types/media";

export const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TMP_ROOT = path.resolve(__dirname, "../../tmp/jobs");
const JOB_TTL_MS = 30 * 60 * 1000; // how long a finished job's file stays downloadable
const EXPIRED_RECORD_TTL_MS = 5 * 60 * 1000; // how long we remember an expired job before forgetting it

export interface JobRecord {
  id: string;
  status: JobStatus;
  percent?: number;
  statusText: string;
  failureReason?: string;
  filePath?: string;
  filename?: string;
  createdAt: number;
  expiresAt: number;
}

const jobs = new Map<string, JobRecord>();

const MAX_CONCURRENT_JOBS = 3;
const TERMINAL_STATUSES: JobStatus[] = ["completed", "failed"];
let activeJobCount = 0;

export function hasCapacityForNewJob(): boolean {
  return activeJobCount < MAX_CONCURRENT_JOBS;
}

export function createJob(): JobRecord {
  activeJobCount += 1;
  const id = randomUUID();
  const now = Date.now();
  const job: JobRecord = {
    id,
    status: "queued",
    statusText: "Queued",
    createdAt: now,
    expiresAt: now + JOB_TTL_MS,
  };
  jobs.set(id, job);
  return job;
}

export function updateJob(jobId: string, patch: Partial<JobRecord>): void {
  const job = jobs.get(jobId);
  if (!job) return;

  const wasTerminal = TERMINAL_STATUSES.includes(job.status);
  Object.assign(job, patch);
  const isTerminal = TERMINAL_STATUSES.includes(job.status);

  if (!wasTerminal && isTerminal) {
    activeJobCount = Math.max(0, activeJobCount - 1);
  }
}

export function getJob(jobId: string): JobRecord | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;

  const isTerminal = job.status === "completed" || job.status === "failed";
  if (isTerminal && Date.now() > job.expiresAt) {
    job.status = "expired";
    job.statusText = "This download has expired.";
    void deleteJobDirectory(jobId);
  }
  return job;
}

function jobDirectory(jobId: string): string {
  const dir = path.join(TMP_ROOT, jobId);
  assertWithinRoot(dir);
  return dir;
}

// Defense in depth, same reasoning as Phase 7: jobId always comes from
// OUR randomUUID(), never user input, but we still verify the resolved
// path can't have escaped TMP_ROOT before touching the filesystem.
function assertWithinRoot(candidate: string): void {
  const resolved = path.resolve(candidate);
  if (resolved !== TMP_ROOT && !resolved.startsWith(TMP_ROOT + path.sep)) {
    throw new Error("Refused to use a path outside the job directory.");
  }
}

export async function ensureJobDirectory(jobId: string): Promise<string> {
  const dir = jobDirectory(jobId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function deleteJobDirectory(jobId: string): Promise<void> {
  await fs.rm(jobDirectory(jobId), { recursive: true, force: true }).catch(() => {});
}

// Runs once a minute:
//  - flips completed/failed jobs past their TTL to "expired" and deletes their files
//  - forgets "expired" records entirely after a grace period, to free memory
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    const isTerminal = job.status === "completed" || job.status === "failed";
    if (isTerminal && now > job.expiresAt) {
      job.status = "expired";
      job.statusText = "This download has expired.";
      void deleteJobDirectory(jobId);
    } else if (job.status === "expired" && now > job.expiresAt + EXPIRED_RECORD_TTL_MS) {
      jobs.delete(jobId);
    }
  }
}, 60 * 1000).unref();