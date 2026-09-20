import assert from "node:assert/strict";
import { test } from "node:test";
import { pragueHour, samePragueDay, shouldRunRetention } from "./tv-data.js";

test("pragueHour čte hodinu v Europe/Prague", () => {
  assert.equal(pragueHour(new Date("2026-01-15T02:30:00.000Z")), 3);
  assert.equal(pragueHour(new Date("2026-07-15T01:30:00.000Z")), 3);
});

test("samePragueDay počítá den v Europe/Prague, ne v UTC", () => {
  assert.equal(samePragueDay(new Date("2026-09-20T20:10:00.000Z"), new Date("2026-09-20T21:30:00.000Z")), true);
  assert.equal(samePragueDay(new Date("2026-09-20T21:30:00.000Z"), new Date("2026-09-20T22:10:00.000Z")), false);
});

test("shouldRunRetention čeká na nastavenou hodinu a běží jednou za den", () => {
  const settings = { retentionEnabled: true, runHour: 3, lastPurgeAt: null as Date | null };
  assert.equal(shouldRunRetention(settings, new Date("2026-09-20T00:30:00.000Z")), false);
  assert.equal(shouldRunRetention(settings, new Date("2026-09-20T01:05:00.000Z")), true);

  const alreadyRan = { ...settings, lastPurgeAt: new Date("2026-09-20T01:10:00.000Z") };
  assert.equal(shouldRunRetention(alreadyRan, new Date("2026-09-20T01:40:00.000Z")), false);
  assert.equal(shouldRunRetention(alreadyRan, new Date("2026-09-21T01:05:00.000Z")), true);
});

test("shouldRunRetention je vypnutý, když cron není zapnutý", () => {
  assert.equal(
    shouldRunRetention(
      { retentionEnabled: false, runHour: 3, lastPurgeAt: null },
      new Date("2026-09-20T01:05:00.000Z"),
    ),
    false,
  );
});
