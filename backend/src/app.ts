import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { mediaRouter } from "./routes/media";
import { jobsRouter } from "./routes/jobs";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.corsOrigin,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "10kb" }));

app.use("/api/health", healthRouter);
app.use("/api/media", mediaRouter);
app.use("/api/jobs", jobsRouter);

// Optional: serve the frontend's production build (`frontend/dist`) if
// it exists, so `npm run build` + `npm start` can run the whole app as
// ONE process on one port. In normal development, this folder doesn't
// exist yet — the two `npm run dev` servers (Vite + this one) are used
// instead, and this block does nothing.
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Any GET request that isn't for /api/... and didn't match a static
  // file falls back to index.html. Not strictly required today (this
  // app has only one page), but this is the standard pattern for
  // single-page apps and avoids a broken experience if routes are ever added.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });

  console.log(`Serving frontend build from ${frontendDistPath}`);
} else {
  console.log(
    "No frontend build found at frontend/dist — run 'npm run build' in frontend/ to enable single-process mode."
  );
}

app.use(errorHandler);