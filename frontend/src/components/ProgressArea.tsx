import type { DownloadJobState } from "../hooks/useDownloadJob";

interface ProgressAreaProps {
  job: DownloadJobState;
  onCancel: () => void;
}

const ACTIVE_STATUSES = ["queued", "analyzing", "downloading", "converting"];
const INDETERMINATE_STATUSES = ["queued", "analyzing", "converting"];

export function ProgressArea({ job, onCancel }: ProgressAreaProps) {
  const isActive = ACTIVE_STATUSES.includes(job.status);
  const isIndeterminate = INDETERMINATE_STATUSES.includes(job.status);

  return (
    <section className="panel" aria-label="Download progress">
      <span className="panel__number" aria-hidden="true">
        RESULT 02
      </span>
      <p className="panel__title">Progress</p>

      {job.status === "idle" && (
        <p className="panel__empty-text">Progress will appear here once a download starts.</p>
      )}

      {isActive && (
        <div className="progress-block">
          <div
            className="progress-bar-track"
            role="progressbar"
            aria-valuenow={isIndeterminate ? undefined : job.percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Download progress"
          >
            <div
              className={`progress-bar-fill ${isIndeterminate ? "progress-bar-fill--indeterminate" : ""}`}
              style={isIndeterminate ? undefined : { width: `${job.percent ?? 0}%` }}
            />
          </div>
          <p className="progress-status" aria-live="polite">
            {job.statusText}
          </p>
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <p className="progress-note">
            Cancel stops tracking this download here. The server may finish
            the file it already started before its own timeout ends it.
          </p>
        </div>
      )}

      {job.status === "completed" && (
        <div className="status-banner status-banner--success" role="status">
          <span className="status-banner__stamp">APPROVED</span>
          Download ready.
        </div>
      )}

      {(job.status === "failed" || job.status === "expired") && (
        <div className="status-banner status-banner--error" role="alert">
          <span className="status-banner__stamp">DENIED</span>
          {job.status === "expired" ? "This download expired." : job.failureReason ?? "Download failed."}
        </div>
      )}
    </section>
  );
}