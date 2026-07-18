describe("downloadJobs", () => {
  let mod: typeof import("./downloadJobs");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    jest.resetModules();
    mod = require("./downloadJobs");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates a job with status queued", () => {
    const job = mod.createJob();
    expect(job.status).toBe("queued");
    expect(mod.getJob(job.id)?.status).toBe("queued");
  });

  it("expires a completed job after its TTL passes", () => {
    const job = mod.createJob();
    mod.updateJob(job.id, { status: "completed", filePath: "/tmp/x/output.mp4", filename: "x.mp4" });
    jest.setSystemTime(new Date("2026-01-01T00:31:00Z")); // 31 minutes later — past the 30-min TTL
    expect(mod.getJob(job.id)?.status).toBe("expired");
  });

  it("does not expire a job before its TTL passes", () => {
    const job = mod.createJob();
    mod.updateJob(job.id, { status: "completed" });
    jest.setSystemTime(new Date("2026-01-01T00:10:00Z")); // only 10 minutes later
    expect(mod.getJob(job.id)?.status).toBe("completed");
  });

  it("returns undefined for an unknown job id", () => {
    expect(mod.getJob("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });

  it("frees a concurrency slot once a job reaches a terminal state", () => {
    const jobs = [mod.createJob(), mod.createJob(), mod.createJob()];
    expect(mod.hasCapacityForNewJob()).toBe(false);
    mod.updateJob(jobs[0].id, { status: "completed" });
    expect(mod.hasCapacityForNewJob()).toBe(true);
  });
});