import { test } from "node:test";
import assert from "node:assert/strict";
import { courseHolePatchSchema } from "./admin.js";

test("uložení tipu nesaže plánek ani par", () => {
  const parsed = courseHolePatchSchema.parse({
    gameType: "fotbalgolf",
    hole: 1,
    tip: "zahraj od prava do leva",
  });
  assert.equal(parsed.imageUrl, undefined);
  assert.equal(parsed.closed, undefined);
  assert.equal(parsed.par, undefined);
  assert.equal(parsed.tip, "zahraj od prava do leva");
});

test("přepnutí rekonstrukce nesaže tip ani plánek", () => {
  const parsed = courseHolePatchSchema.parse({
    gameType: "fotbalgolf",
    hole: 2,
    closed: true,
  });
  assert.equal(parsed.imageUrl, undefined);
  assert.equal(parsed.tip, undefined);
  assert.equal(parsed.closed, true);
});

test("uložení paru nesaže tip ani plánek", () => {
  const parsed = courseHolePatchSchema.parse({
    gameType: "fotbalgolf",
    hole: 4,
    par: 3,
  });
  assert.equal(parsed.par, 3);
  assert.equal(parsed.tip, undefined);
  assert.equal(parsed.imageUrl, undefined);
});

test("prázdný tip se uloží jako null, ne jako smazání plánku", () => {
  const parsed = courseHolePatchSchema.parse({
    gameType: "minigolf",
    hole: 3,
    tip: "  ",
  });
  assert.equal(parsed.tip, null);
  assert.equal(parsed.imageUrl, undefined);
});
