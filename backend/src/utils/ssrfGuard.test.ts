import { assertPublicHttpUrl } from "./ssrfGuard";
import dns from "node:dns/promises";

jest.mock("node:dns/promises");
const mockedLookup = dns.lookup as jest.MockedFunction<typeof dns.lookup>;

describe("assertPublicHttpUrl", () => {
  beforeEach(() => {
    mockedLookup.mockReset();
  });

  it("allows a public IP address", async () => {
    mockedLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as any);
    await expect(assertPublicHttpUrl("https://example.com")).resolves.toBeUndefined();
  });

  it("rejects localhost by hostname", async () => {
    await expect(assertPublicHttpUrl("http://localhost:4000")).rejects.toThrow(/disallowed host/i);
  });

  it("rejects a hostname resolving to a private IP", async () => {
    mockedLookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }] as any);
    await expect(assertPublicHttpUrl("https://internal.example.com")).rejects.toThrow(/private|internal/i);
  });

  it("rejects loopback IPs", async () => {
    mockedLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }] as any);
    await expect(assertPublicHttpUrl("https://sneaky.example.com")).rejects.toThrow(/private|internal/i);
  });

  it("rejects link-local addresses (e.g. cloud metadata endpoints)", async () => {
    mockedLookup.mockResolvedValue([{ address: "169.254.169.254", family: 4 }] as any);
    await expect(assertPublicHttpUrl("https://metadata.example.com")).rejects.toThrow(/private|internal/i);
  });

  it("rejects non-http(s) protocols", async () => {
    await expect(assertPublicHttpUrl("ftp://example.com")).rejects.toThrow(/http/i);
  });

  it("fails closed when DNS resolution errors", async () => {
    mockedLookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertPublicHttpUrl("https://doesnotexist.invalid")).rejects.toThrow(/resolve/i);
  });
});