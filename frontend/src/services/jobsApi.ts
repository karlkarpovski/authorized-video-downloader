import type { JobStatus, MediaFormat, MediaQuality } from "../types/media";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CreateJobRequest {
  url: string;
  permissionConfirmed: boolean;
  format: MediaFormat;
  quality: MediaQuality;
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  statusText: string;
  expiresAt: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  percent?: number;
  statusText: string;
  failureReason?: string;
  filename?: string;
  downloadUrl?: string;
  expiresAt: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed.");
  }
  return data as T;
}

export async function createDownloadJob(request: CreateJobRequest): Promise<CreateJobResponse> {
  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<CreateJobResponse>(response);
}

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
  return handleResponse<JobStatusResponse>(response);
}

export function buildJobFileUrl(relativeDownloadUrl: string): string {
  return `${API_BASE_URL}${relativeDownloadUrl}`;
}