import { useEffect, useState } from "react";
import { checkHealth } from "../services/mediaApi";

export type BackendStatus = "checking" | "online" | "offline";

export function useBackendHealth(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    checkHealth().then((isOnline) => {
      if (!cancelled) {
        setStatus(isOnline ? "online" : "offline");
      }
    });

    // Avoids calling setState after the component has unmounted,
    // e.g. if the user navigates away before the health check resolves.
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}