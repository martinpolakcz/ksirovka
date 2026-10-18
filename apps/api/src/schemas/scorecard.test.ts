import assert from "node:assert/strict";
import { test } from "node:test";
import { submitRoundSchema, upsertProfileSchema } from "./scorecard.js";

test("profil přijme platformu a jazyk z telefonu", () => {
  const parsed = upsertProfileSchema.parse({
    email: "martin@example.com",
    name: "Martin Polák",
    nickname: "Martin",
    platform: "ios",
    locale: "cs",
  });
  assert.equal(parsed.platform, "ios");
  assert.equal(parsed.locale, "cs");
});

test("profil přijme rok narození, fotku a souhlas s novinkami", () => {
  const parsed = upsertProfileSchema.parse({
    email: "martin@example.com",
    name: "Martin Polák",
    nickname: "Martin",
    birthYear: 1988,
    noticesOptIn: true,
    photo: "a".repeat(40),
  });
  assert.equal(parsed.birthYear, 1988);
  assert.equal(parsed.noticesOptIn, true);
});

test("odeslání kola si pamatuje zařízení v submittedBy", () => {
  const parsed = submitRoundSchema.parse({
    id: "round-1",
    gameType: "fotbalgolf",
    format: "individual",
    players: [{ id: "p1", name: "Martin" }],
    holes: [{ hole: 1, scores: { p1: 2 } }],
    startedAt: "2026-10-17T12:00:00.000Z",
    completedAt: "2026-10-17T13:00:00.000Z",
    results: [
      {
        playerId: "p1",
        playerName: "Martin",
        total: 2,
        rank: 1,
        bestHole: { hole: 1, score: 2 },
        worstHole: { hole: 1, score: 2 },
      },
    ],
    submittedBy: {
      email: "martin@example.com",
      name: "Martin",
      platform: "android",
      locale: "sk",
    },
  });
  assert.equal(parsed.submittedBy?.platform, "android");
  assert.equal(parsed.submittedBy?.locale, "sk");
});
