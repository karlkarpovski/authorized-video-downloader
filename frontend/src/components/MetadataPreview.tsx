import type { MediaMetadata } from "../types/media";

interface MetadataPreviewProps {
  metadata: MediaMetadata | null;
  isLoading: boolean;
}

export function MetadataPreview({ metadata, isLoading }: MetadataPreviewProps) {
  return (
    <section className="panel" aria-label="Video details" aria-live="polite">
      <span className="panel__number" aria-hidden="true">
        RESULT 01
      </span>
      <p className="panel__title">Video details</p>

      {isLoading && (
        <div className="skeleton-block" aria-hidden="true">
          <div className="skeleton-line skeleton-line--thumb" />
          <div className="skeleton-line skeleton-line--wide" />
          <div className="skeleton-line skeleton-line--medium" />
          <div className="skeleton-line skeleton-line--narrow" />
        </div>
      )}

      {!isLoading && !metadata && (
        <p className="panel__empty-text">
          Submit a URL above to see its title, thumbnail, and duration here.
        </p>
      )}

      {!isLoading && metadata && (
        <div className="metadata-card">
          {metadata.thumbnailUrl && (
            <img src={metadata.thumbnailUrl} alt="" className="metadata-card__thumbnail" />
          )}
          <dl className="metadata-list">
            <div className="metadata-list__row">
              <dt>Title</dt>
              <dd>{metadata.title ?? "Unavailable"}</dd>
            </div>
            <div className="metadata-list__row">
              <dt>Uploader</dt>
              <dd>{metadata.uploader ?? "Unavailable"}</dd>
            </div>
            <div className="metadata-list__row">
              <dt>Duration</dt>
              <dd>{formatDuration(metadata.durationSeconds)}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined) {
    return "Unavailable";
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}