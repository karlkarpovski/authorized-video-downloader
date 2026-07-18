import { useCallback, useEffect, useRef, useState } from "react";
import { createDownloadJob, fetchJobStatus, buildJobFileUrl } from "../services/jobsApi";
import type { JobStatus, MediaFormat, MediaQuality } from "../types/media";

const POLL_INTERVAL_MS = 1000;

export interface DownloadJobState {
  jobId: string | null;
  status: JobStatus | "idle";
  percent?: number;
  statusText: string;
  failureReason?: string;
  fileUrl?: string;
}

const IDLE_STATE: DownloadJobState = { jobId: null, status: "idle", statusText: "" };

export function useDownloadJob() {
  const [state, setState] = useState<DownloadJobState>(IDLE_STATE);
  const pollTimer = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimer.current !== null) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const start = useCallback(
    async (url: string, format: MediaFormat, quality: MediaQuality) => {
      cancelledRef.current = false;

      try {
        const created = await createDownloadJob({ url, permissionConfirmed: true, format, quality });
        if (cancelledRef.current) return;

        setState({ jobId: created.jobId, status: created.status, statusText: created.statusText });

        pollTimer.current = window.setInterval(async () => {
          try {
            const job = await fetchJobStatus(created.jobId);
            if (cancelledRef.current) return;

            setState({
              jobId: job.jobId,
              status: job.status,
              percent: job.percent,
              statusText: job.statusText,
              failureReason: job.failureReason,
              fileUrl: job.downloadUrl ? buildJobFileUrl(job.downloadUrl) : undefined,
            });

            if (job.status === "completed" || job.status === "failed" || job.status === "expired") {
              stopPolling();
            }
          } catch {
            if (!cancelledRef.current) {
              setState((prev) => ({
                ...prev,
                status: "failed",
                statusText: "Failed",
                failureReason: "Lost connection to the server while checking progress.",
              }));
              stopPolling();
            }
          }
        }, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelledRef.current) return;
        setState({
          jobId: null,
          status: "failed",
          statusText: "Failed",
          failureReason: err instanceof Error ? err.message : "Could not start the download.",
        });
      }
    },
    [stopPolling]
  );

  // IMPORTANT: this only stops the FRONTEND from tracking this job.
  // There is no backend endpoint to kill the in-progress yt-dlp process,
  // so the server may keep working until it finishes or hits its own
  // timeout. The UI is upfront about this rather than implying a true
  // server-side cancel that doesn't exist.
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    setState(IDLE_STATE);
  }, [stopPolling]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    setState(IDLE_STATE);
  }, [stopPolling]);

  return { state, start, cancel, reset };
}