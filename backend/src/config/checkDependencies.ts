import { spawn } from "node:child_process";

interface DependencyCheckResult {
  name: string;
  found: boolean;
  versionOutput?: string;
}

function checkCommand(command: string, args: string[]): Promise<DependencyCheckResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true });
    let output = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.on("error", () => resolve({ name: command, found: false }));
    child.on("close", (code) => {
      resolve({ name: command, found: code === 0, versionOutput: output.trim().split("\n")[0] });
    });
  });
}

export async function checkRequiredDependencies(): Promise<DependencyCheckResult[]> {
  const [ytDlp, ffmpeg] = await Promise.all([
    checkCommand("yt-dlp", ["--version"]),
    checkCommand("ffmpeg", ["-version"]),
  ]);
  return [ytDlp, ffmpeg];
}