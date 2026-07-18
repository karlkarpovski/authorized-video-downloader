import { useState, type FormEvent } from "react";
import { Header } from "./components/Header";
import { LegalNotice } from "./components/LegalNotice";
import { BackendStatusBanner } from "./components/BackendStatusBanner";
import { UrlInput } from "./components/UrlInput";
import { PermissionCheckbox } from "./components/PermissionCheckbox";
import { FormatSelector } from "./components/FormatSelector";
import { QualitySelector } from "./components/QualitySelector";
import { MetadataPreview } from "./components/MetadataPreview";
import { ProgressArea } from "./components/ProgressArea";
import { DownloadButton } from "./components/DownloadButton";
import { ErrorMessage } from "./components/ErrorMessage";
import { isValidHttpUrl } from "./utils/validateUrl";
import { analyzeMedia, BackendUnavailableError } from "./services/mediaApi";
import { useBackendHealth } from "./hooks/useBackendHealth";
import { useDownloadJob } from "./hooks/useDownloadJob";
import {
  isVideoFormat,
  type MediaFormat,
  type MediaMetadata,
  type MediaQuality,
} from "./types/media";
import "./App.css";

const ACTIVE_JOB_STATUSES = ["queued", "analyzing", "downloading", "converting"];

function App() {
  const backendStatus = useBackendHealth();
  const job = useDownloadJob();

  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<MediaFormat>("MP4");
  const [quality, setQuality] = useState<MediaQuality>("best");
  const [permissionChecked, setPermissionChecked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [availableFormats, setAvailableFormats] = useState<MediaFormat[] | undefined>(undefined);
  const [availableQualities, setAvailableQualities] = useState<MediaQuality[] | undefined>(undefined);

  const isUrlValid = isValidHttpUrl(url);
  const isSubmitDisabled = !isUrlValid || !permissionChecked || isLoading;
  const isJobActive = ACTIVE_JOB_STATUSES.includes(job.state.status);

  function handleFormatChange(nextFormat: MediaFormat) {
    setFormat(nextFormat);
    setQuality(isVideoFormat(nextFormat) ? "best" : "320kbps");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isUrlValid) {
      setError("Enter a valid http:// or https:// URL.");
      return;
    }
    if (!permissionChecked) {
      setError("Confirm you have permission to download this content.");
      return;
    }

    setError(undefined);
    setMetadata(null);
    setAvailableFormats(undefined);
    setAvailableQualities(undefined);
    job.reset();
    setIsLoading(true);

    try {
      const result = await analyzeMedia({ url, permissionConfirmed: permissionChecked });
      setMetadata(result.metadata);
      setAvailableFormats(result.availableFormats);
      setAvailableQualities(result.availableQualities);

      if (!result.availableFormats.includes(format)) {
        const fallback = result.availableFormats[0];
        if (fallback) handleFormatChange(fallback);
      }
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong analyzing that URL. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleStartDownload() {
    job.start(url, format, quality);
  }

  return (
    <main className="page">
      <div className="card">
        <Header />
        <BackendStatusBanner status={backendStatus} />
        <LegalNotice />

        <form className="declaration-form" aria-label="Media download request" onSubmit={handleSubmit}>
          <UrlInput value={url} onChange={setUrl} hasError={Boolean(error) && !isUrlValid} />
          <PermissionCheckbox checked={permissionChecked} onChange={setPermissionChecked} />
          <FormatSelector
            value={format}
            onChange={handleFormatChange}
            availableFormats={availableFormats}
            disabled={isJobActive}
          />
          <QualitySelector
            format={format}
            value={quality}
            onChange={setQuality}
            availableQualities={availableQualities}
            disabled={isJobActive}
          />

          <ErrorMessage message={error} />

          <button type="submit" className="analyze-button" disabled={isSubmitDisabled}>
            {isLoading ? "Analyzing…" : "Analyze URL"}
          </button>
        </form>

        <div className="results">
          <MetadataPreview metadata={metadata} isLoading={isLoading} />
          <ProgressArea job={job.state} onCancel={job.cancel} />
          <DownloadButton
            hasMetadata={metadata !== null}
            jobStatus={job.state.status}
            fileUrl={job.state.fileUrl}
            onStart={handleStartDownload}
            onRetry={handleStartDownload}
          />
        </div>
      </div>
    </main>
  );
}

export default App;