import { spawn } from "node:child_process";

const YTDLP_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_BYTES = 2_000_000; // 2MB cap — a metadata JSON blob should never be this big

export interface YtDlpFormat {
  height?: number;
  acodec?: string;
}

export interface YtDlpInfo {
  title?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  formats?: YtDlpFormat[];
  is_live?: boolean;
}

export class YtDlpError extends Error {}

export function fetchMediaInfo(url: string): Promise<YtDlpInfo> {
  return new Promise((resolve, reject) => {
    // Argument ARRAY, not a shell string. Each element here is passed to
    // the process directly — the OS never re-parses it as shell syntax.
    // If we instead built a string like `yt-dlp --dump-json ${url}` and
    // ran it through a shell, a URL such as
    //   https://x.com/a; rm -rf / #
    // would let the attacker chain a second command after the semicolon.
    // With spawn() + an array, that entire string is just one opaque
    // argument — there is no shell involved to interpret `;` at all.
    const args = [
      "--dump-json",
      "--no-playlist",
      "--skip-download",
      "--no-warnings",
      "--socket-timeout",
      "10",
      url,
    ];

    const child = spawn("yt-dlp", args, { windowsHide: true });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let outputTooLarge = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(new YtDlpError("Lookup timed out."));
      }
    }, YTDLP_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      if (outputTooLarge) return;
      stdout += chunk.toString("utf8");
      if (stdout.length > MAX_OUTPUT_BYTES) {
        outputTooLarge = true;
        child.kill("SIGKILL");
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
        new YtDlpError(
          code === "ENOENT" ? "yt-dlp is not installed or not on PATH." : "Failed to start yt-dlp."
        )
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (outputTooLarge) {
        reject(new YtDlpError("Response from source was too large."));
        return;
      }
      if (code !== 0) {
        reject(new YtDlpError(summarizeStderr(stderr)));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as YtDlpInfo);
      } catch {
        reject(new YtDlpError("Could not parse metadata for this URL."));
      }
    });
  });
}

function summarizeStderr(stderr: string): string {
  if (/private|sign in|login/i.test(stderr)) {
    return "This video is private or requires login, which isn't supported.";
  }
  if (/unsupported url/i.test(stderr)) {
    return "This URL isn't from a supported source.";
  }
  return "Couldn't retrieve information for this URL.";
}