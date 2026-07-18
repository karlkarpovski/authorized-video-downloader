import dns from "node:dns/promises";
import { AppError } from "../middleware/errorHandler";

const BLOCKED_HOSTNAMES = ["localhost", "0.0.0.0", "::1"];
const BLOCKED_HOSTNAME_SUFFIXES = [".local", ".internal", ".lan", ".corp", ".home"];

/**
 * Throws if the URL is anything other than a public http/https address.
 * Checked AFTER basic format validation, since this does a real DNS
 * lookup (slower, and only worth doing once we know the URL is well-formed).
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  const parsed = new URL(rawUrl);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError("Only http:// and https:// URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new AppError("This URL points to a disallowed host.");
  }
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new AppError("This URL points to a disallowed host.");
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true, verbatim: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new AppError("Could not resolve this URL's host.");
  }

  if (addresses.length === 0) {
    throw new AppError("Could not resolve this URL's host.");
  }

  for (const address of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new AppError(
        "This URL points to a private or internal network address, which is not allowed."
      );
    }
  }
}

function isPrivateOrReservedIp(address: string): boolean {
  return address.includes(":") ? isPrivateOrReservedIpv6(address) : isPrivateOrReservedIpv4(address);
}

function isPrivateOrReservedIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return true; // malformed — fail closed
  }
  const [a, b] = parts;

  if (a === 10) return true; // 10.0.0.0/8 — private
  if (a === 127) return true; // loopback
  if (a === 0) return true; // "this network"
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 — private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 — private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 — CGNAT
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking range
  if (a >= 224) return true; // multicast + reserved

  return false;
}

function isPrivateOrReservedIpv6(address: string): boolean {
  const n = address.toLowerCase();

  if (n === "::1" || n === "::") return true; // loopback / unspecified
  if (n.startsWith("fc") || n.startsWith("fd")) return true; // unique local (fc00::/7)
  if (["fe8", "fe9", "fea", "feb"].some((p) => n.startsWith(p))) return true; // link-local

  // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1 — unwrap and recheck as IPv4
  const mapped = n.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    return isPrivateOrReservedIpv4(mapped[1]);
  }

  return false;
}