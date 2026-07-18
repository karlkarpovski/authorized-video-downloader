# Authorized Media Downloader

A local tool for downloading video/audio you own, that's public domain,
Creative Commons, or that you otherwise have explicit permission to
download. It is not a tool for bypassing private, login-gated, or
DRM-protected content, and it does not attempt to.

## Legal-use limitations

This tool only automates a lookup/download step — it has no way to
verify that you actually hold the rights or permission you confirm via
the checkbox. You are responsible for:
- Respecting the copyright of any content you download
- Respecting the terms of service of the platform you're downloading from
- Only downloading content you own, that's public domain, permissively
  licensed, or that you have explicit permission to download

Some platforms' terms of service prohibit downloading even when a video
is technically accessible without a login. Confirming the permission
checkbox does not resolve that — it's your responsibility to know the
terms of the platform you're using.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)
- [FFmpeg](https://ffmpeg.org/download.html)

On Windows, both yt-dlp and FFmpeg can be installed with:
```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```
Close and reopen your terminal afterward so `PATH` updates, then verify:
```powershell
yt-dlp --version
ffmpeg -version
```

### Setup
```powershell
git clone https://github.com/<your-username>/authorized-video-downloader.git
cd authorized-video-downloader

cd frontend
npm install
copy .env.example .env
cd ..

cd backend
npm install
copy .env.example .env
cd ..
```

## Development commands

Run frontend and backend as two separate dev servers (recommended while
actively developing — both hot-reload on save):

Terminal 1:
```powershell
cd backend
npm run dev
```

Terminal 2:
```powershell
cd frontend
npm run dev
```
Open the URL Vite prints (typically `http://localhost:5173`).

Run backend tests:
```powershell
cd backend
npm test
```

Run frontend tests:
```powershell
cd frontend
npm test
```

## Production build commands

Build the frontend, then run the backend, which will automatically
detect and serve the built frontend from the same process and port:

```powershell
cd frontend
npm run build
cd ..

cd backend
npm run build
npm start
```
Open `http://localhost:4000` — both the UI and the API are now served
from this one address. No separate frontend server is needed in this mode.

## Supported formats

| Type | Formats |
|---|---|
| Video | MP4, WEBM |
| Audio | MP3, WAV, M4A |

Quality options are filtered to what's actually available for the
specific video being analyzed, where the source provides enough detail
to determine that.

Note on WAV: WAV is lossless, but converting to it does not improve
quality if the original source audio was already compressed (true for
almost all public video platforms). You'll get a much larger file that
sounds the same as the MP3/M4A version would have. WAV is only a real
quality benefit when the *original* source is lossless.

## Known limitations

- This is a local, single-user tool with no authentication. Anyone
  who can reach the port can use it. Do not expose this directly to the
  public internet without adding authentication (see the deployment
  review, Phase 14).
- SSRF protection has a known gap: URLs are checked against a
  private/reserved-IP blocklist at request time, but a malicious server
  could change its DNS record between that check and the actual
  connection (DNS rebinding). This is not fully closed in the current
  implementation.
- The job store is in-memory only. Restarting the backend loses all
  in-progress and recently-completed job records.
- No playlists, no livestreams, and videos over 60 minutes are rejected.
- Cancel is client-side only. Cancelling a download in the UI stops
  the frontend from tracking that job, but the server-side process may
  continue running until it finishes or hits its own timeout — there is
  no backend endpoint to kill an in-progress download.
- Maximum file size: 500MB for video, 200MB for audio.

## Security notes

- All external processes (`yt-dlp`) are invoked with argument arrays via
  `spawn()`, never shell strings — this is the primary defense against
  command injection.
- Job IDs are always server-generated UUIDs; the real filesystem paths
  of downloaded files are never sent to the frontend.
- Filenames are built from a Unicode-aware allow-list (letters, digits,
  hyphen, underscore, space in any script) — dangerous characters like
  path separators are stripped before a file is ever written.
- Rate limiting: 20 analyze requests/minute, 5 download-job creations/minute,
  per IP. A maximum of 3 downloads can run concurrently regardless of
  how many different IPs are requesting them.
- See the full threat model from the Phase 10 security review for more detail.

This application has not been independently audited and should not be
considered fully secure. It's built for personal, local use with
reasonable protections in place — not for public, unauthenticated deployment.

## Cleanup behavior

Downloaded files live in `backend/tmp/jobs/<jobId>/` and are automatically
deleted 30 minutes after a job completes or fails. A background sweep
checks for expired jobs every minute. There is currently no manual
"clear all" button — restarting the backend does not delete existing
files on disk, only the in-memory job records that reference them.

## Troubleshooting

"yt-dlp is not installed or not on PATH" — reinstall yt-dlp and make
sure you opened a *new* terminal window after installing (PATH changes
don't apply to already-open terminals).

Backend shows a red "Can't reach the backend server" banner in the UI
— confirm the backend's `npm run dev` (or `npm start`) is actually
running, and that `frontend/.env`'s `VITE_API_BASE_URL` matches the port
it's running on.

A download gets stuck at "Analyzing…" indefinitely — check the
backend terminal for errors; this usually means yt-dlp itself is hanging
on a slow or unresponsive source. It will time out automatically after
15 seconds for analysis, 5 minutes for downloads.

"This URL points to a private or internal network address" on a URL
you believe is public — the SSRF guard blocks anything resolving to a
private/reserved IP range. If you believe this is a false positive on a
genuinely public address, check what `nslookup <hostname>` actually
resolves to.

Downloaded file plays but has no audio, or vice versa — confirm
FFmpeg is installed and on PATH; yt-dlp relies on it to merge separate
video and audio streams.