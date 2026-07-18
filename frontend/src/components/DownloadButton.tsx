import type { JobStatus } from "../types/media";

interface DownloadButtonProps {
  hasMetadata: boolean;
  jobStatus: JobStatus | "idle";
  fileUrl?: string;
  onStart: () => void;
  onRetry: () => void;
}

const ACTIVE_STATUSES = ["queued", "analyzing", "downloading", "converting"];

export function DownloadButton({ hasMetadata, jobStatus, fileUrl, onStart, onRetry }: DownloadButtonProps) {
  if (jobStatus === "completed" && fileUrl) {
    return (
      <a href={fileUrl} className="download-button download-button--ready" download>
        Save file
      </a>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(jobStatus);
  const isFailed = jobStatus === "failed" || jobStatus === "expired";

  return (
    <button
      type="button"
      className="download-button"
      disabled={!hasMetadata || isActive}
      onClick={isFailed ? onRetry : onStart}
    >
      {isActive ? "Working…" : isFailed ? "Retry download" : "Start download"}
    </button>
  );
}