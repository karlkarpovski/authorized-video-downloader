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

export const VIDEO_QUALITIES: MediaQuality[] = [
  "best",
  "1080p",
  "720p",
  "480p",
  "360p",
];

export const AUDIO_QUALITIES: MediaQuality[] = [
  "320kbps",
  "192kbps",
  "128kbps",
];

export interface MediaMetadata {
  title?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  uploader?: string;
}

export function isVideoFormat(format: MediaFormat): boolean {
  return (VIDEO_FORMATS as string[]).includes(format);
}

export type JobStatus =
  | "queued"
  | "analyzing"
  | "downloading"
  | "converting"
  | "completed"
  | "failed"
  | "expired";