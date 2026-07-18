import { app } from "./app";
import { env } from "./config/env";
import { checkRequiredDependencies } from "./config/checkDependencies";

async function start() {
  console.log("Checking required dependencies...");
  const results = await checkRequiredDependencies();

  let allFound = true;
  for (const result of results) {
    if (result.found) {
      console.log(`  [ok] ${result.name} found (${result.versionOutput})`);
    } else {
      allFound = false;
      console.error(`  [MISSING] ${result.name} not found on PATH.`);
    }
  }

  if (!allFound) {
    console.error(
      "\n" +
        "WARNING: One or more required tools are missing.\n" +
        "Analyze and download requests will fail until these are installed:\n" +
        "  - yt-dlp: https://github.com/yt-dlp/yt-dlp#installation\n" +
        "  - FFmpeg: https://ffmpeg.org/download.html\n" +
        "On Windows:\n" +
        "  winget install yt-dlp.yt-dlp\n" +
        "  winget install Gyan.FFmpeg\n" +
        "The server will still start so you can review the rest of the app.\n"
    );
  }

  app.listen(env.port, () => {
    console.log(`\nBackend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});