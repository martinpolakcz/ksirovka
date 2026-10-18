export const SHARE_CARD_MAX_BYTES = 2_500_000;

export type ShareCardMime = "image/jpeg" | "image/png";

export function sniffImageMime(bytes: Uint8Array): ShareCardMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  return null;
}

export function decodeShareCard(image: string): { mime: ShareCardMime; data: Buffer } | { error: "invalid" | "size" | "type" } {
  const trimmed = image.trim();
  const comma = trimmed.indexOf(",");
  const base64 =
    trimmed.startsWith("data:") && comma >= 0 ? trimmed.slice(comma + 1) : trimmed;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64) || base64.replace(/\s/g, "").length < 32) {
    return { error: "invalid" };
  }
  const data = Buffer.from(base64, "base64");
  if (data.length < 32) return { error: "invalid" };
  if (data.length > SHARE_CARD_MAX_BYTES) return { error: "size" };
  const mime = sniffImageMime(data);
  if (!mime) return { error: "type" };
  return { mime, data };
}

export function shareCardPublicUrl(roundId: number, version: Date | number) {
  const stamp = version instanceof Date ? version.getTime() : version;
  return `/api/v1/scorecard/share-cards/${roundId}?v=${stamp}`;
}

export function profilePhotoPublicUrl(profileId: number, version: Date | number) {
  const stamp = version instanceof Date ? version.getTime() : version;
  return `/api/v1/scorecard/profile-photos/${profileId}?v=${stamp}`;
}
