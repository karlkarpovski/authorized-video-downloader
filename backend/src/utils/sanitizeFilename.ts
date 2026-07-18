export function sanitizeFilename(input: string, maxLength = 80): string {
  const cleaned = input
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "") // allow-list: letters, digits, hyphen, underscore, space (any script)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^\.+/, ""); // avoid producing a hidden/dotfile-like name

  const truncated = cleaned.slice(0, maxLength);
  return truncated.length > 0 ? truncated : "download";
}