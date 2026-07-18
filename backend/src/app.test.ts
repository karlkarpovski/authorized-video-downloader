import request from "supertest";
import dns from "node:dns/promises";

jest.mock("node:dns/promises");
jest.mock("../services/jobRunner", () => ({
  runDownloadJob: jest.fn().mockResolvedValue(undefined),
}));

import { app } from "./app";

const mockedLookup = dns.lookup as jest.MockedFunction<typeof dns.lookup>;

beforeEach(() => {
  mockedLookup.mockReset();
});

describe("GET /api/health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/media/analyze", () => {
  it("rejects a missing URL", async () => {
    const res = await request(app).post("/api/media/analyze").send({ permissionConfirmed: true });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed URL", async () => {
    const res = await request(app)
      .post("/api/media/analyze")
      .send({ url: "not-a-url", permissionConfirmed: true });
    expect(res.status).toBe(400);
  });

  it("rejects when permission is not confirmed", async () => {
    const res = await request(app)
      .post("/api/media/analyze")
      .send({ url: "https://example.com/video", permissionConfirmed: false });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/permission/i);
  });

  it("rejects a URL resolving to a private IP address", async () => {
    mockedLookup.mockResolvedValue([{ address: "192.168.1.5", family: 4 }] as any);
    const res = await request(app)
      .post("/api/media/analyze")
      .send({ url: "https://internal.example.com", permissionConfirmed: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/private|internal/i);
  });
});

describe("POST /api/jobs", () => {
  const validBody = {
    url: "https://example.com/video",
    permissionConfirmed: true,
    format: "MP4",
    quality: "720p",
  };

  it("rejects an invalid format", async () => {
    const res = await request(app).post("/api/jobs").send({ ...validBody, format: "AVI" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid quality", async () => {
    const res = await request(app).post("/api/jobs").send({ ...validBody, quality: "8000p" });
    expect(res.status).toBe(400);
  });

  it("rejects when permission is not confirmed", async () => {
    const res = await request(app).post("/api/jobs").send({ ...validBody, permissionConfirmed: false });
    expect(res.status).toBe(400);
  });

  it("rejects a private-network URL", async () => {
    mockedLookup.mockResolvedValue([{ address: "10.0.0.1", family: 4 }] as any);
    const res = await request(app)
      .post("/api/jobs")
      .send({ ...validBody, url: "https://internal.example.com" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid request and returns a queued job (background work is mocked)", async () => {
    mockedLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as any);
    const res = await request(app).post("/api/jobs").send(validBody);
    expect(res.status).toBe(202);
    expect(res.body.status).toBe("queued");
    expect(res.body.jobId).toBeDefined();
  });
});

describe("GET /api/jobs/:jobId/file", () => {
  it("rejects a job id that isn't a valid UUID format (covers path-traversal-style payloads too)", async () => {
    const res = await request(app).get("/api/jobs/not-a-valid-id/file");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("returns 404 for a well-formed but unknown job id", async () => {
    const res = await request(app).get("/api/jobs/00000000-0000-0000-0000-000000000000/file");
    expect(res.status).toBe(404);
  });
});