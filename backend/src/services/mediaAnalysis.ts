import { fetchMediaInfo, YtDlpError } from "./ytdlp";
import { AppError } from "../middleware/errorHandler";
import { ALLOWED_FORMATS, type MediaFormat, type MediaMetadata, type MediaQuality } from "../types/media";

export interface AnalysisResult {
  metadata: MediaMetadata;
  availableFormats: MediaFormat[];
  availableQualities: MediaQuality[];
}

export async function analyzeMediaUrl(url: string): Promise<AnalysisResult> {
  let info;
  try {
    info = await fetchMediaInfo(url);
  } catch (err) {
    if (err instanceof YtDlpError) {
      // 422 = request was well-formed, but the source couldn't be processed
      throw new AppError(err.message, 422);
    }
    throw err;
  }

  const metadata: MediaMetadata = {
    title: info.title ?? "Untitled",
    thumbnailUrl: info.thumbnail,
    durationSeconds: info.duration ?? 0,
    uploader: info.uploader ?? "Unknown uploader",
  };

  const heights = new Set<number>();
  let hasAudio = false;
  for (const format of info.formats ?? []) {
    if (typeof format.height === "number") heights.add(format.height);
    if (format.acodec && format.acodec !== "none") hasAudio = true;
  }

  const availableFormats: MediaFormat[] = [];
  if (heights.size > 0) availableFormats.push("MP4", "WEBM");
  if (hasAudio) availableFormats.push("MP3", "WAV", "M4A");
  if (availableFormats.length === 0) {
    // yt-dlp didn't give us enough to be sure — fall back to the full list
    // rather than wrongly telling the user nothing is available.
    availableFormats.push(...ALLOWED_FORMATS);
  }

  const availableQualities: MediaQuality[] = ["best"];
  for (const target of [1080, 720, 480, 360] as const) {
    if ([...heights].some((h) => h >= target)) {
      availableQualities.push(`${target}p` as MediaQuality);
    }
  }
  if (hasAudio) {
    availableQualities.push("320kbps", "192kbps", "128kbps");
  }

  return { metadata, availableFormats, availableQualities };
}