import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeEmail, normalizePlayerName, getPeriodBounds, nicknameHeldByOther } from "./scorecard.js";
import { lookupProfileQuerySchema } from "../schemas/scorecard.js";


test("normalizeEmail je lowercase a bez mezer", () => {
  assert.equal(normalizeEmail("  A@Ksirovka.CZ "), "a@ksirovka.cz");
});

test("lookupProfileQuerySchema bere platný e-mail", () => {
  assert.equal(lookupProfileQuerySchema.safeParse({ email: "ja@ksirovka.cz" }).success, true);
  assert.equal(lookupProfileQuerySchema.safeParse({ email: "neplatny" }).success, false);
});

test("normalizePlayerName slučuje mezery a převede na malá písmena", () => {
  assert.equal(normalizePlayerName("  Jan  Novák "), "jan novák");
});

test("nicknameHeldByOther je true jen když přezdívku drží jiný e-mail", () => {
  assert.equal(nicknameHeldByOther("ja@ksirovka.cz", [{ email: null }]), false);
  assert.equal(nicknameHeldByOther("ja@ksirovka.cz", [{ email: "ja@ksirovka.cz" }]), false);
  assert.equal(nicknameHeldByOther("ja@ksirovka.cz", [{ email: "jiny@ksirovka.cz" }]), true);
});

test("getPeriodBounds day začíná i končí dneškem v Praze", () => {
  const now = new Date("2026-09-14T12:00:00.000Z");
  const bounds = getPeriodBounds("day", now);
  assert.equal(bounds.from, "2026-09-14");
  assert.equal(bounds.to, "2026-09-14");
});
