import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeShareCard, photoDownloadFilename, shareCardPublicUrl, sniffImageMime } from "./share-card.js";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 40 }, () => 0)]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: 40 }, () => 0)]);

test("pozná JPEG a PNG podle hlavičky", () => {
  assert.equal(sniffImageMime(jpeg), "image/jpeg");
  assert.equal(sniffImageMime(png), "image/png");
  assert.equal(sniffImageMime(Buffer.from("not-an-image")), null);
});

test("dekóduje base64 i data URL", () => {
  const raw = decodeShareCard(jpeg.toString("base64"));
  assert.equal("mime" in raw && raw.mime, "image/jpeg");
  const dataUrl = decodeShareCard(`data:image/png;base64,${png.toString("base64")}`);
  assert.equal("mime" in dataUrl && dataUrl.mime, "image/png");
});

test("odmítne cizí typ a prázdný vstup", () => {
  assert.deepEqual(decodeShareCard("@@@"), { error: "invalid" });
  assert.deepEqual(decodeShareCard(Buffer.from("hello world this is not an image!!!!").toString("base64")), {
    error: "type",
  });
});

test("veřejná URL nese verzi kvůli cache", () => {
  assert.equal(shareCardPublicUrl(12, new Date(1_700_000_000_000)), "/api/v1/scorecard/share-cards/12?v=1700000000000");
});

test("název stažené fotky je bez diakritiky", () => {
  assert.equal(
    photoDownloadFilename(new Date("2026-10-18T10:00:00.000Z"), "MartinPolak", "hra"),
    "ksirovka_hra_2026-10-18_martinpolak.jpg",
  );
});
