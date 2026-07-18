import { EventEmitter } from "node:events";
import { fetchMediaInfo, YtDlpError } from "./ytdlp";
import { spawn } from "node:child_process";

jest.mock("node:child_process");
const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;

class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill = jest.fn();
}

describe("fetchMediaInfo", () => {
  let child: FakeChildProcess;

  beforeEach(() => {
    jest.useFakeTimers();
    child = new FakeChildProcess();
    mockedSpawn.mockReturnValue(child as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves parsed JSON on success", async () => {
    const promise = fetchMediaInfo("https://example.com/video");
    child.stdout.emit("data", Buffer.from(JSON.stringify({ title: "Test Video", duration: 42 })));
    child.emit("close", 0);
    await expect(promise).resolves.toEqual({ title: "Test Video", duration: 42 });
  });

  it("rejects with a friendly message for unsupported media (non-zero exit)", async () => {
    const promise = fetchMediaInfo("https://example.com/not-a-video");
    child.stderr.emit("data", Buffer.from("ERROR: Unsupported URL"));
    child.emit("close", 1);
    await expect(promise).rejects.toBeInstanceOf(YtDlpError);
  });

  it("rejects on invalid JSON output", async () => {
    const promise = fetchMediaInfo("https://example.com/video");
    child.stdout.emit("data", Buffer.from("not json"));
    child.emit("close", 0);
    await expect(promise).rejects.toThrow(/parse/i);
  });

  it("times out if yt-dlp never responds", async () => {
    const promise = fetchMediaInfo("https://example.com/video");
    jest.advanceTimersByTime(20_000);
    await expect(promise).rejects.toThrow(/timed out/i);
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
  });

  it("rejects with a clear message when yt-dlp is not installed", async () => {
    const promise = fetchMediaInfo("https://example.com/video");
    const enoentError = Object.assign(new Error("spawn yt-dlp ENOENT"), { code: "ENOENT" });
    child.emit("error", enoentError);
    await expect(promise).rejects.toThrow(/not installed/i);
  });
});