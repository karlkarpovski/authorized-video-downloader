import type { MediaFormat, MediaMetadata, MediaQuality } from "../types/media";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface AnalyzeRequest {
  url: string;
  permissionConfirmed: boolean;
}

export interface AnalyzeResult {
  metadata: MediaMetadata;
  availableFormats: MediaFormat[];
  availableQualities: MediaQuality[];
}

interface ApiErrorResponse {
  error: string;
}

export class BackendUnavailableError extends Error {}

export async function analyzeMedia(request: AnalyzeRequest): Promise<AnalyzeResult> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/media/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new BackendUnavailableError(
      "Can't reach the server. Make sure the backend is running."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    const errorBody = data as ApiErrorResponse;
    throw new Error(errorBody.error ?? "Something went wrong analyzing that URL.");
  }

  return data as AnalyzeResult;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}