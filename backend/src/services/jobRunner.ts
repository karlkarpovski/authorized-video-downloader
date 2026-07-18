import { fetchMediaInfo, YtDlpError } from "./ytdlp";
import { downloadVideo, downloadAudio, YtDlpDownloadError } from "./ytdlpDownload";
import { ensureJobDirectory, updateJob } from "./downloadJobs";
import { sanitizeFilename } from "../utils/sanitizeFilename";
import type { MediaFormat, MediaQuality } from "../types/media";

const MAX_DURATION_SECONDS = 60 * 60;

const VIDEO_FORMAT_TO_CONTAINER: Partial<Record<MediaFormat, "mp4" | "webm">> = {
  MP4: "mp4",
  WEBM: "webm",
};
const AUDIO_FORMAT_TO_CONTAINER: Partial<Record<MediaFormat, "mp3" | "wav" | "m4a">> = {
  MP3: "mp3",
  WAV: "wav",
  M4A: "m4a",
};
const VIDEO_QUALITY_VALUES = ["best", "1080p", "720p", "480p", "360p"];
const AUDIO_QUALITY_VALUES = ["320kbps", "192kbps", "128kbps"];

export async function runDownloadJob(
  jobId: string,
  url: string,
  format: MediaFormat,
  quality: MediaQuality
): Promise<void> {
  try {
    const videoContainer = VIDEO_FORMAT_TO_CONTAINER[format];
    const audioContainer = AUDIO_FORMAT_TO_CONTAINER[format];

    if (!videoContainer && !audioContainer) {
      fail(jobId, "Unsupported format.");
      return;
    }

    updateJob(jobId, { status: "analyzing", statusText: "Fetching video information…" });

    let info;
    try {
      info = await fetchMediaInfo(url);
    } catch (err) {
      fail(jobId, err instanceof YtDlpError ? err.message : "Couldn't fetch video information.");
      return;
    }

    if (info.is_live) {
      fail(jobId, "Live streams aren't supported.");
      return;
    }
    if ((info.duration ?? 0) > MAX_DURATION_SECONDS) {
      fail(jobId, `This video is longer than the ${MAX_DURATION_SECONDS / 60}-minute limit for this tool.`);
      return;
    }

    const jobDir = await ensureJobDirectory(jobId);
    updateJob(jobId, { status: "downloading", statusText: "Downloading…", percent: 0 });

    const onProgress = (update: { percent?: number; phase: "downloading" | "converting" }) => {
      if (update.phase === "converting") {
        updateJob(jobId, { status: "converting", statusText: "Converting audio…" });
      } else if (typeof update.percent === "number") {
        updateJob(jobId, {
          status: "downloading",
          statusText: `Downloading… ${update.percent}%`,
          percent: update.percent,
        });
      }
    };

    let filePath: string;
    let extension: string;

    try {
      if (videoContainer) {
        if (!VIDEO_QUALITY_VALUES.includes(quality)) {
          fail(jobId, "That quality isn't valid for video downloads.");
          return;
        }
        filePath = await downloadVideo({
          url,
          outputDir: jobDir,
          quality: quality as "best" | "1080p" | "720p" | "480p" | "360p",
          containerFormat: videoContainer,
          onProgress,
        });
        extension = videoContainer;
      } else {
        if (!AUDIO_QUALITY_VALUES.includes(quality)) {
          fail(jobId, "That quality isn't valid for audio downloads.");
          return;
        }
        filePath = await downloadAudio({
          url,
          outputDir: jobDir,
          audioFormat: audioContainer!,
          quality: quality as "320kbps" | "192kbps" | "128kbps",
          onProgress,
        });
        extension = audioContainer!;
      }
    } catch (err) {
      fail(jobId, err instanceof YtDlpDownloadError ? err.message : "Download failed.");
      return;
    }

    const filename = `${sanitizeFilename(info.title ?? "download")}.${extension}`;

    updateJob(jobId, {
      status: "completed",
      statusText: "Completed",
      percent: 100,
      filePath,
      filename,
    });
  } catch (err) {
    console.error(`[job ${jobId}] unexpected error:`, err);
    fail(jobId, "Something unexpected went wrong.");
  }
}

function fail(jobId: string, reason: string): void {
  updateJob(jobId, { status: "failed", statusText: "Failed", failureReason: reason });
}