export type MediaFormat = "MP4" | "WEBM" | "MP3" | "WAV" | "M4A";

export type MediaQuality =
  | "best"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "320kbps"
  | "192kbps"
  | "128kbps";

export const VIDEO_FORMATS: MediaFormat[] = ["MP4", "WEBM"];
export const AUDIO_FORMATS: MediaFormat[] = ["MP3", "WAV", "M4A"];
export const ALLOWED_FORMATS: MediaFormat[] = [...VIDEO_FORMATS, ...AUDIO_FORMATS];

export const VIDEO_QUALITIES: MediaQuality[] = ["best", "1080p", "720p", "480p", "360p"];
export const AUDIO_QUALITIES: MediaQuality[] = ["320kbps", "192kbps", "128kbps"];
export const ALLOWED_QUALITIES: MediaQuality[] = [...VIDEO_QUALITIES, ...AUDIO_QUALITIES];

export interface AnalyzeRequestBody {
  url: string;
  permissionConfirmed: boolean;
}

export interface MediaMetadata {
  title: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  uploader: string;
}

export interface AnalyzeResponseBody {
  metadata: MediaMetadata;
  availableFormats: MediaFormat[];
  availableQualities: MediaQuality[];
}

export interface DownloadRequestBody {
  url: string;
  permissionConfirmed: boolean;
  format: MediaFormat;
  quality: MediaQuality;
}

export type JobStatus =
  | "queued"
  | "analyzing"
  | "downloading"
  | "converting"
  | "completed"
  | "failed"
  | "expired";

export interface CreateJobResponseBody {
  jobId: string;
  status: JobStatus;
  statusText: string;
  expiresAt: string;
}

export interface JobStatusResponseBody {
  jobId: string;
  status: JobStatus;
  percent?: number;
  statusText: string;
  failureReason?: string;
  filename?: string;
  downloadUrl?: string;
  expiresAt: string;
}