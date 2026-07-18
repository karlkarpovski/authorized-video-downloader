import type { BackendStatus } from "../hooks/useBackendHealth";

interface BackendStatusBannerProps {
  status: BackendStatus;
}

export function BackendStatusBanner({ status }: BackendStatusBannerProps) {
  if (status !== "offline") {
    return null;
  }

  return (
    <div className="backend-status-banner" role="alert">
      Can't reach the backend server. Make sure it's running, then refresh
      this page.
    </div>
  );
}