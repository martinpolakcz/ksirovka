import { test } from "node:test";
import assert from "node:assert/strict";
import { isOfficialRound } from "./course.js";

test("oficiální kolo má skóre na všech otevřených jamkách", () => {
  assert.equal(
    isOfficialRound({
      finishedEarly: false,
      openHoles: [1, 2, 3],
      playerIds: [10, 11],
      scored: [
        { playerId: 10, hole: 1 },
        { playerId: 10, hole: 2 },
        { playerId: 10, hole: 3 },
        { playerId: 11, hole: 1 },
        { playerId: 11, hole: 2 },
        { playerId: 11, hole: 3 },
      ],
    }),
    true,
  );
});

test("staré 18jamkové kolo není oficiální při 20 otevřených", () => {
  const openHoles = Array.from({ length: 20 }, (_, i) => i + 1);
  const scored = Array.from({ length: 18 }, (_, i) => ({ playerId: 1, hole: i + 1 }));
  assert.equal(
    isOfficialRound({
      finishedEarly: false,
      openHoles,
      playerIds: [1],
      scored,
    }),
    false,
  );
});

test("předčasné kolo není oficiální", () => {
  assert.equal(
    isOfficialRound({
      finishedEarly: true,
      openHoles: [1, 2],
      playerIds: [1],
      scored: [
        { playerId: 1, hole: 1 },
        { playerId: 1, hole: 2 },
      ],
    }),
    false,
  );
});
