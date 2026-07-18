import { sanitizeFilename } from "./sanitizeFilename";

describe("sanitizeFilename", () => {
  it("keeps safe ASCII characters", () => {
    expect(sanitizeFilename("My Cool Video")).toBe("My-Cool-Video");
  });

  it("preserves non-Latin scripts", () => {
    expect(sanitizeFilename("配信動画のタイトル")).toBe("配信動画のタイトル");
  });

  it("strips path traversal and separator characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).not.toMatch(/[./\\]/);
  });

  it("strips quotes, colons, and other dangerous punctuation", () => {
    const result = sanitizeFilename('video: "the best" <one>?');
    expect(result).not.toMatch(/["<>:?]/);
  });

  it("falls back to 'download' when nothing safe remains", () => {
    expect(sanitizeFilename("★彡✔️💯")).toBe("download");
  });

  it("truncates very long titles", () => {
    const longTitle = "a".repeat(200);
    expect(sanitizeFilename(longTitle).length).toBeLessThanOrEqual(80);
  });

  it("does not produce a leading-dot hidden filename", () => {
    expect(sanitizeFilename("...secret")).not.toMatch(/^\./);
  });
});