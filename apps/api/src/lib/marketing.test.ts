import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMarketingSnapshot } from "./marketing.js";

test("marketing počítá sobotní odpoledne, hry a vs par v Europe/Prague", () => {
  const snapshot = buildMarketingSnapshot({
    now: new Date("2026-10-18T12:00:00.000Z"),
    rounds: [
      {
        id: 1,
        gameType: "fotbalgolf",
        startedAt: new Date("2026-10-17T12:00:00.000Z"),
        completedAt: new Date("2026-10-17T13:30:00.000Z"),
        hidden: false,
        finishedEarly: false,
        submittedByEmail: "martin@example.com",
        submittedByName: "Martin",
      },
      {
        id: 2,
        gameType: "minigolf",
        startedAt: new Date("2026-10-16T08:00:00.000Z"),
        completedAt: new Date("2026-10-16T09:00:00.000Z"),
        hidden: true,
        finishedEarly: false,
        submittedByEmail: null,
        submittedByName: null,
      },
    ],
    players: [
      { id: 11, roundId: 1, name: "Martin", nameNormalized: "martin", total: 44 },
      { id: 12, roundId: 1, name: "Eva", nameNormalized: "eva", total: 41 },
      { id: 21, roundId: 2, name: "Ghost", nameNormalized: "ghost", total: 50 },
    ],
    holes: [
      { roundId: 1, playerId: 11, hole: 1, score: 3 },
      { roundId: 1, playerId: 11, hole: 2, score: 2 },
      { roundId: 1, playerId: 12, hole: 1, score: 2 },
      { roundId: 1, playerId: 12, hole: 2, score: 1 },
    ],
    profiles: [
      {
        name: "Martin Polák",
        nickname: "Martin",
        nicknameNormalized: "martin",
        email: "martin@example.com",
        platform: "ios",
        locale: "cs",
      },
    ],
    pars: [
      { gameType: "fotbalgolf", hole: 1, par: 2 },
      { gameType: "fotbalgolf", hole: 2, par: 2 },
    ],
  });

  assert.equal(snapshot.summary.rounds, 1);
  assert.equal(snapshot.summary.players, 2);
  assert.equal(snapshot.summary.registered, 1);
  assert.equal(snapshot.summary.peakWeekday?.label, "So");
  assert.equal(snapshot.summary.peakHour?.hour, 14);
  assert.equal(snapshot.summary.favoriteGame?.gameType, "fotbalgolf");
  assert.equal(snapshot.games.find((game) => game.gameType === "fotbalgolf")?.avgVsPar, 0);
  assert.equal(snapshot.vsPar.avg, 0);

  const martin = snapshot.players.find((player) => player.nickname === "Martin");
  assert.ok(martin);
  assert.equal(martin.email, "martin@example.com");
  assert.equal(martin.platform, "ios");
  assert.equal(martin.locale, "cs");
  assert.equal(martin.avgVsPar, 1);
  assert.equal(martin.name, "Martin Polák");
  assert.deepEqual(martin.gamesPlayed, ["fotbalgolf"]);
  assert.equal(martin.daysSinceLast, 1);
  assert.equal(martin.history.length, 1);
  assert.equal(martin.history[0]?.label, "Fotbalgolf");
  assert.equal(martin.history[0]?.date, "2026-10-17");
  assert.equal(martin.noticesOptIn, false);
  assert.equal(snapshot.summary.contactable, 1);
  assert.equal(snapshot.summary.inboxable, 0);
  assert.ok(snapshot.campaigns.some((item) => item.id === "cross-fotbalgolf-minigolf" && item.emails === 1));
  assert.ok(snapshot.campaigns.some((item) => item.id === "no-email" && item.players === 1));
  assert.equal(snapshot.languages[0]?.id, "cs");

  const october = snapshot.months.find((month) => month.month === 10);
  const saturday = october?.days.find((day) => day.date === "2026-10-17");
  assert.equal(saturday?.rounds, 1);
  assert.equal(saturday?.players, 2);
  const log = snapshot.days["2026-10-17"];
  assert.ok(log);
  assert.equal(log.rounds.length, 1);
  assert.equal(log.rounds[0]?.label, "Fotbalgolf");
  assert.equal(log.rounds[0]?.hour, 14);
  assert.deepEqual(
    log.rounds[0]?.players.map((player) => player.name),
    ["Eva", "Martin"],
  );
  assert.equal(log.rounds[0]?.players[1]?.firstVisit, true);
  assert.equal(log.rounds[0]?.players[1]?.email, "martin@example.com");
  assert.equal(
    snapshot.players.some((player) => player.nickname === "Ghost"),
    false,
  );
});
