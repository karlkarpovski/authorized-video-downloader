import { spawn } from "node:child_process";
import path from "node:path";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILESIZE = "500M";
const AUDIO_MAX_FILESIZE = "200M";

const BITRATE_MAP: Record<string, string> = {
  "320kbps": "320K",
  "192kbps": "192K",
  "128kbps": "128K",
};

export class YtDlpDownloadError extends Error {}

export type ProgressPhase = "downloading" | "converting";
export type ProgressCallback = (update: { percent?: number; phase: ProgressPhase }) => void;

interface DownloadOptions {
  url: string;
  outputDir: string;
  quality: "best" | "1080p" | "720p" | "480p" | "360p";
  containerFormat: "mp4" | "webm";
  onProgress?: ProgressCallback;
}

export function downloadVideo({
  url,
  outputDir,
  quality,
  containerFormat,
  onProgress,
}: DownloadOptions): Promise<string> {
  const heightLimit = quality === "best" ? undefined : Number(quality.replace("p", ""));
  const formatSelector = heightLimit
    ? `bestvideo[height<=${heightLimit}]+bestaudio/best[height<=${heightLimit}]`
    : "bestvideo+bestaudio/best";

  const outputTemplate = path.join(outputDir, "output.%(ext)s");

  // Argument array, not a shell string — same command-injection defense
  // explained in Phase 6: url is one opaque argument, never re-parsed by a shell.
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "-f",
    formatSelector,
    "--merge-output-format",
    containerFormat,
    "--max-filesize",
    MAX_FILESIZE,
    "--socket-timeout",
    "15",
    "-o",
    outputTemplate,
    url,
  ];

  return runYtDlp(args, onProgress).then(() => path.join(outputDir, `output.${containerFormat}`));
}

interface AudioDownloadOptions {
  url: string;
  outputDir: string;
  audioFormat: "mp3" | "wav" | "m4a";
  quality: "320kbps" | "192kbps" | "128kbps";
  onProgress?: ProgressCallback;
}

export function downloadAudio({
  url,
  outputDir,
  audioFormat,
  quality,
  onProgress,
}: AudioDownloadOptions): Promise<string> {
  const outputTemplate = path.join(outputDir, "output.%(ext)s");
  const bitrate = BITRATE_MAP[quality];

  const args = [
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "-f",
    "bestaudio/best",
    "--extract-audio",
    "--audio-format",
    audioFormat,
    "--max-filesize",
    AUDIO_MAX_FILESIZE,
    "--socket-timeout",
    "15",
    "-o",
    outputTemplate,
    url,
  ];

  // WAV is lossless — a target bitrate isn't meaningful for it the way
  // it is for MP3/M4A, so --audio-quality is only added for lossy formats.
  if (audioFormat !== "wav" && bitrate) {
    args.splice(args.indexOf("--extract-audio") + 1, 0, "--audio-quality", bitrate);
  }

  return runYtDlp(args, onProgress).then(() => path.join(outputDir, `output.${audioFormat}`));
}

const PERCENT_PATTERN = /\[download\]\s+(\d{1,3}(?:\.\d+)?)%/;
const CONVERTING_PATTERN = /\[(ExtractAudio|Merger|VideoConvertor|ffmpeg)\]/i;

function runYtDlp(args: string[], onProgress?: ProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", args, { windowsHide: true });

    let stderr = "";
    let stdoutBuffer = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(new YtDlpDownloadError("Operation timed out."));
      }
    }, DOWNLOAD_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString("utf8");
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? ""; // keep any incomplete trailing line for the next chunk

      for (const line of lines) {
        if (CONVERTING_PATTERN.test(line)) {
          onProgress?.({ phase: "converting" });
          continue;
        }
        const match = line.match(PERCENT_PATTERN);
        if (match) {
          onProgress?.({ percent: Math.round(Number(match[1])), phase: "downloading" });
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const code = (err as NodeJS.ErrnoException).code;
      reject(
        new YtDlpDownloadError(
          code === "ENOENT" ? "yt-dlp is not installed or not on PATH." : "Failed to start process."
        )
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new YtDlpDownloadError(summarize(stderr)));
        return;
      }
      resolve();
    });
  });
}

function summarize(stderr: string): string {
  if (/max-filesize|File is larger/i.test(stderr)) {
    return "This file exceeds the maximum allowed size.";
  }
  if (/private|sign in|login/i.test(stderr)) {
    return "This video is private or requires login, which isn't supported.";
  }
  return "Couldn't process this request.";
}