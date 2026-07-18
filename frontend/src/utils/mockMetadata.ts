import type { MediaMetadata } from "../types/media";

export function fetchMockMetadata(url: string): Promise<MediaMetadata> {
  const hostname = safeHostname(url);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: `Sample video from ${hostname}`,
        thumbnailUrl: undefined,
        durationSeconds: 217,
        uploader: hostname,
      });
    }, 900);
  });
}

function safeHostname(url: string): string {
  try {
    return new URL(url.trim()).hostname;
  } catch {
    return "unknown source";
  }
}