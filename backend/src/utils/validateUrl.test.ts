import { isWellFormedHttpUrl } from "./validateUrl";

describe("isWellFormedHttpUrl", () => {
  it("accepts a well-formed https URL", () => {
    expect(isWellFormedHttpUrl("https://example.com/video")).toBe(true);
  });

  it("accepts a well-formed http URL", () => {
    expect(isWellFormedHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects a non-string value", () => {
    expect(isWellFormedHttpUrl(undefined)).toBe(false);
    expect(isWellFormedHttpUrl(123)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isWellFormedHttpUrl("   ")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isWellFormedHttpUrl("not a url")).toBe(false);
  });

  it("rejects non-http(s) protocols", () => {
    expect(isWellFormedHttpUrl("ftp://example.com/file")).toBe(false);
    expect(isWellFormedHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isWellFormedHttpUrl("javascript:alert(1)")).toBe(false);
  });
});