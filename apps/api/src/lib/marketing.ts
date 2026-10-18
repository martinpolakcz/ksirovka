import { eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  scoreCourseHoles,
  scoreHoleScores,
  scorePlayers,
  scoreProfiles,
  scoreRounds,
} from "../db/schema.js";
import { gameTypes, type GameType } from "../schemas/scorecard.js";
import { normalizeEmail, normalizePlayerName, pragueWeekday, pragueYmd } from "./scorecard.js";
import { profilePhotoPublicUrl } from "./share-card.js";
import { pragueHour } from "./tv-data.js";

const WEEKDAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"] as const;
const WEEKDAY_WHEN = ["v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu", "v neděli"] as const;
const MONTH_LABELS = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
] as const;
const GAME_LABELS: Record<GameType, string> = {
  fotbalgolf: "Fotbalgolf",
  minigolf: "Minigolf",
  adventure: "Adventure Golf",
};
const FORMAT_LABELS: Record<string, string> = {
  individual: "jednotlivci",
  pairs: "dvojice",
  foursome: "foursome",
  fourball: "fourball",
};
const HOUR_FROM = 8;
const HOUR_TO = 21;
const CALENDAR_MONTHS = 3;
const LAPSED_AFTER_DAYS = 14;
const REGULAR_ROUNDS = 3;

export type MarketingYmd = { year: number; month: number; day: number };

export type MarketingRoundRow = {
  id: number;
  gameType: string;
  format?: string | null;
  startedAt: Date;
  completedAt: Date;
  hidden: boolean;
  finishedEarly: boolean;
  submittedByEmail: string | null;
  submittedByName: string | null;
};

export type MarketingPlayerRow = {
  id: number;
  roundId: number;
  name: string;
  nameNormalized: string;
  total: number;
};

export type MarketingHoleRow = {
  roundId: number;
  playerId: number;
  hole: number;
  score: number;
};

export type MarketingProfileRow = {
  id?: number;
  name: string;
  nickname: string;
  nicknameNormalized: string;
  email: string;
  platform: string | null;
  locale: string | null;
  birthYear?: number | null;
  noticesOptIn?: boolean;
  hasPhoto?: boolean;
  photoUpdatedAt?: Date | null;
};

export type MarketingVisit = {
  date: string;
  gameType: GameType;
  label: string;
  total: number;
  vsPar: number | null;
};

export type MarketingParRow = {
  gameType: string;
  hole: number;
  par: number;
};

export type MarketingVsParBucket = {
  id: string;
  label: string;
  count: number;
};

export type MarketingGameStat = {
  gameType: GameType;
  label: string;
  rounds: number;
  players: number;
  avgVsPar: number | null;
  bestVsPar: number | null;
  bestPlayer: string | null;
};

export type MarketingWeekday = {
  dow: number;
  label: string;
  rounds: number;
  players: number;
};

export type MarketingHour = {
  hour: number;
  label: string;
  rounds: number;
};

export type MarketingHeatCell = {
  dow: number;
  hour: number;
  rounds: number;
};

export type MarketingCalendarDay = {
  date: string;
  weekday: number;
  inMonth: boolean;
  rounds: number;
  players: number;
};

export type MarketingCalendarMonth = {
  year: number;
  month: number;
  label: string;
  days: MarketingCalendarDay[];
};

export type MarketingDayPlayer = {
  name: string;
  total: number;
  vsPar: number | null;
  email: string | null;
  firstVisit: boolean;
};

export type MarketingDayRound = {
  id: number;
  gameType: GameType;
  label: string;
  format: string;
  startedAt: string;
  completedAt: string;
  hour: number;
  minutes: number;
  finishedEarly: boolean;
  players: MarketingDayPlayer[];
};

export type MarketingDayLog = {
  date: string;
  rounds: MarketingDayRound[];
};

export type MarketingPlayer = {
  nickname: string;
  name: string | null;
  email: string | null;
  platform: string | null;
  locale: string | null;
  profileId: number | null;
  birthYear: number | null;
  age: number | null;
  noticesOptIn: boolean;
  photoUrl: string | null;
  rounds: number;
  firstPlayedAt: string | null;
  lastPlayedAt: string | null;
  daysSinceLast: number | null;
  avgVsPar: number | null;
  favoriteGame: GameType | null;
  gamesPlayed: GameType[];
  history: MarketingVisit[];
};

export type MarketingCampaign = {
  id: string;
  title: string;
  pitch: string;
  subject: string;
  players: number;
  emails: number;
  nicknames: string[];
};

export type MarketingMix = {
  id: string;
  label: string;
  players: number;
};

export type MarketingSnapshot = {
  generatedAt: string;
  summary: {
    rounds: number;
    players: number;
    registered: number;
    contactable: number;
    inboxable: number;
    lapsed: number;
    regulars: number;
    newThisMonth: number;
    peakWeekday: MarketingWeekday | null;
    peakHour: MarketingHour | null;
    favoriteGame: MarketingGameStat | null;
  };
  campaigns: MarketingCampaign[];
  languages: MarketingMix[];
  platforms: MarketingMix[];
  games: MarketingGameStat[];
  vsPar: {
    avg: number | null;
    buckets: MarketingVsParBucket[];
  };
  weekdays: MarketingWeekday[];
  hours: MarketingHour[];
  hourHeatmap: MarketingHeatCell[];
  months: MarketingCalendarMonth[];
  days: Record<string, MarketingDayLog>;
  players: MarketingPlayer[];
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function ymdKey(ymd: MarketingYmd): string {
  return `${ymd.year}-${pad(ymd.month)}-${pad(ymd.day)}`;
}

export function addDays(ymd: MarketingYmd, days: number): MarketingYmd {
  const date = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function isoDowFromYmd(ymd: MarketingYmd): number {
  const date = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day));
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

function mondayOnOrBefore(ymd: MarketingYmd): MarketingYmd {
  return addDays(ymd, 1 - isoDowFromYmd(ymd));
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isGameType(value: string): value is GameType {
  return (gameTypes as readonly string[]).includes(value);
}

function parFor(pars: Map<string, number>, gameType: string, hole: number): number {
  return pars.get(`${gameType}:${hole}`) ?? 2;
}

function vsParBucket(vsPar: number): { id: string; label: string } {
  if (vsPar <= -6) return { id: "deep-under", label: "−6 a lepší" };
  if (vsPar <= -1) return { id: "under", label: "−5 až −1" };
  if (vsPar === 0) return { id: "even", label: "Na par" };
  if (vsPar <= 5) return { id: "over", label: "+1 až +5" };
  return { id: "deep-over", label: "+6 a horší" };
}

function pragueDayIndex(date: Date): number {
  const ymd = pragueYmd(date);
  return Date.UTC(ymd.year, ymd.month - 1, ymd.day) / 86_400_000;
}

export function daysSincePrague(from: Date, now: Date): number {
  return Math.max(0, Math.round(pragueDayIndex(now) - pragueDayIndex(from)));
}

function localeMixLabel(id: string): string {
  const labels: Record<string, string> = {
    cs: "Čeština",
    sk: "Slovenčina",
    en: "English",
    de: "Deutsch",
    pl: "Polski",
    vi: "Tiếng Việt",
  };
  return labels[id] ?? id;
}

function mixCounts(values: Array<string | null>, label: (id: string) => string): MarketingMix[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, players]) => ({ id, label: label(id), players }))
    .sort((a, b) => b.players - a.players);
}

function peopleAcc(count: number): string {
  if (count === 1) return "1 hráče";
  if (count >= 2 && count <= 4) return `${count} hráče`;
  return `${count} hráčů`;
}

function peopleNom(count: number): string {
  if (count === 1) return "1 hráč";
  if (count >= 2 && count <= 4) return `${count} hráči`;
  return `${count} hráčů`;
}

function campaign(
  id: string,
  title: string,
  pitch: string,
  subject: string,
  people: MarketingPlayer[],
): MarketingCampaign {
  const emails = people.filter((player) => player.email).length;
  return {
    id,
    title,
    pitch,
    subject,
    players: people.length,
    emails,
    nicknames: people.map((player) => player.nickname),
  };
}

export function buildCampaigns(input: {
  players: MarketingPlayer[];
  peakWeekday: MarketingWeekday | null;
  peakHour: MarketingHour | null;
  lapsed: MarketingPlayer[];
  regulars: MarketingPlayer[];
  newThisMonth: MarketingPlayer[];
  contactable: MarketingPlayer[];
}): MarketingCampaign[] {
  const items: MarketingCampaign[] = [];
  const reachable = input.contactable;

  if (input.peakWeekday && input.peakHour) {
    items.push({
      id: "slot",
      title: "Kdy je chytit",
      pitch: `Nejvíc jich chodí ${WEEKDAY_WHEN[input.peakWeekday.dow - 1]} v ${input.peakHour.label}. Stories, newsletter i SMS hoď den předtím odpoledne, ať to stihnou naplánovat.`,
      subject: `Zahraj si na Kšírovce · ${input.peakWeekday.label} ${input.peakHour.label}`,
      players: input.peakWeekday.players,
      emails: reachable.length,
      nicknames: reachable.map((player) => player.nickname),
    });
  }

  if (input.lapsed.length > 0) {
    items.push(
      campaign(
        "comeback",
        "Ztrácejí se",
        `${peopleNom(input.lapsed.length)} s e-mailem tu ${input.lapsed.length === 1 ? "nebyl" : "nebyli"} ${LAPSED_AFTER_DAYS}+ dní. Krátká zpráva stačí: nové jamky, par, kamarád, kterého nechali ve hře.`,
        "Chybíš nám na Kšírovce",
        input.lapsed,
      ),
    );
  }

  for (const played of gameTypes) {
    for (const missing of gameTypes) {
      if (played === missing) continue;
      const people = reachable.filter(
        (player) => player.gamesPlayed.includes(played) && !player.gamesPlayed.includes(missing),
      );
      if (people.length === 0) continue;
      items.push(
        campaign(
          `cross-${played}-${missing}`,
          `${GAME_LABELS[played]} → ${GAME_LABELS[missing]}`,
          `${peopleNom(people.length)} ${people.length === 1 ? "hraje" : "hrají"} ${GAME_LABELS[played].toLocaleLowerCase("cs")} a ${GAME_LABELS[missing].toLocaleLowerCase("cs")} ${people.length === 1 ? "ještě nezkusil" : "ještě nezkusili"}. To je nejjednodušší kampaň: „přijď na vedlejší hřiště“.`,
          `Zkus na Kšírovce ${GAME_LABELS[missing].toLocaleLowerCase("cs")}`,
          people,
        ),
      );
    }
  }

  if (input.newThisMonth.length > 0) {
    items.push(
      campaign(
        "new",
        "Nové tváře",
        `${peopleNom(input.newThisMonth.length)} tu v tomhle měsíci ${input.newThisMonth.length === 1 ? "hrál poprvé" : "hráli poprvé"}. Pozvi ${input.newThisMonth.length === 1 ? "ho" : "je"} na druhou hru, ať z jednorázové návštěvy uděláš návyk.`,
        "Druhé kolo na Kšírovce máš u nás",
        input.newThisMonth,
      ),
    );
  }

  if (input.regulars.length > 0) {
    items.push(
      campaign(
        "regulars",
        "Věrní",
        `${peopleNom(input.regulars.length)} už ${input.regulars.length === 1 ? "má" : "mají"} aspoň ${REGULAR_ROUNDS} kola a e-mail. To jsou lidé na turnaj, firemní večer, voucher kamarádovi.`,
        "Máme pro vás turnaj na Kšírovce",
        input.regulars,
      ),
    );
  }

  const mute = input.players.filter((player) => player.rounds > 0 && !player.email);
  if (mute.length > 0) {
    items.push({
      id: "no-email",
      title: "Bez e-mailu",
      pitch: `${peopleAcc(mute.length)} známe jen podle přezdívky. U recepce nebo v appce je potřeba profil — jinak je neoslovíš.`,
      subject: "",
      players: mute.length,
      emails: 0,
      nicknames: mute.map((player) => player.nickname),
    });
  }

  return items;
}

function roundAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function playerVsPar(
  round: MarketingRoundRow,
  player: MarketingPlayerRow,
  holes: MarketingHoleRow[],
  pars: Map<string, number>,
): number | null {
  const scored = holes.filter((hole) => hole.roundId === round.id && hole.playerId === player.id);
  if (scored.length > 0) {
    const strokes = scored.reduce((sum, hole) => sum + hole.score, 0);
    const par = scored.reduce((sum, hole) => sum + parFor(pars, round.gameType, hole.hole), 0);
    return strokes - par;
  }
  if (player.total > 0) {
    return player.total - 40;
  }
  return null;
}

export function buildMarketingSnapshot(input: {
  now?: Date;
  rounds: MarketingRoundRow[];
  players: MarketingPlayerRow[];
  holes: MarketingHoleRow[];
  profiles: MarketingProfileRow[];
  pars: MarketingParRow[];
}): MarketingSnapshot {
  const now = input.now ?? new Date();
  const pars = new Map(input.pars.map((row) => [`${row.gameType}:${row.hole}`, row.par]));
  const rounds = input.rounds.filter((round) => !round.hidden);
  const roundIds = new Set(rounds.map((round) => round.id));
  const players = input.players.filter((player) => roundIds.has(player.roundId));
  const holes = input.holes.filter((hole) => roundIds.has(hole.roundId));

  const playersByRound = new Map<number, MarketingPlayerRow[]>();
  for (const player of players) {
    const list = playersByRound.get(player.roundId) ?? [];
    list.push(player);
    playersByRound.set(player.roundId, list);
  }

  const profilesByNick = new Map(input.profiles.map((profile) => [profile.nicknameNormalized, profile]));
  const profilesByEmail = new Map(
    input.profiles.map((profile) => [normalizeEmail(profile.email), profile]),
  );

  const weekdays: MarketingWeekday[] = WEEKDAY_LABELS.map((label, index) => ({
    dow: index + 1,
    label,
    rounds: 0,
    players: 0,
  }));
  const hours: MarketingHour[] = [];
  for (let hour = HOUR_FROM; hour <= HOUR_TO; hour += 1) {
    hours.push({ hour, label: `${pad(hour)}:00`, rounds: 0 });
  }
  const hourIndex = new Map(hours.map((item, index) => [item.hour, index]));
  const heat = new Map<string, number>();

  const gameStats = new Map<
    GameType,
    { rounds: number; playerKeys: Set<string>; vs: number[]; bestVsPar: number | null; bestPlayer: string | null }
  >();
  for (const gameType of gameTypes) {
    gameStats.set(gameType, {
      rounds: 0,
      playerKeys: new Set(),
      vs: [],
      bestVsPar: null,
      bestPlayer: null,
    });
  }

  const allVs: number[] = [];
  const buckets = new Map<string, MarketingVsParBucket>();
  for (const seed of [
    vsParBucket(-8),
    vsParBucket(-3),
    vsParBucket(0),
    vsParBucket(3),
    vsParBucket(8),
  ]) {
    buckets.set(seed.id, { ...seed, count: 0 });
  }

  const byDay = new Map<string, { rounds: number; players: Set<string> }>();
  const byDayRounds = new Map<string, MarketingDayRound[]>();
  type PlayerAcc = {
    nickname: string;
    name: string | null;
    email: string | null;
    platform: string | null;
    locale: string | null;
    profileId: number | null;
    birthYear: number | null;
    noticesOptIn: boolean;
    hasPhoto: boolean;
    photoUpdatedAt: Date | null;
    rounds: number;
    firstPlayedAt: Date | null;
    lastPlayedAt: Date | null;
    vs: number[];
    games: Map<GameType, number>;
    history: MarketingVisit[];
  };
  const byPlayer = new Map<string, PlayerAcc>();

  function playerAcc(key: string, nickname: string): PlayerAcc {
    const existing = byPlayer.get(key);
    if (existing) return existing;
    const created: PlayerAcc = {
      nickname,
      name: null,
      email: null,
      platform: null,
      locale: null,
      profileId: null,
      birthYear: null,
      noticesOptIn: false,
      hasPhoto: false,
      photoUpdatedAt: null,
      rounds: 0,
      firstPlayedAt: null,
      lastPlayedAt: null,
      vs: [],
      games: new Map(),
      history: [],
    };
    byPlayer.set(key, created);
    return created;
  }

  function applyProfile(acc: PlayerAcc, profile: MarketingProfileRow) {
    acc.nickname = profile.nickname;
    acc.name = profile.name;
    acc.email = profile.email;
    acc.platform = profile.platform;
    acc.locale = profile.locale;
    acc.profileId = profile.id ?? acc.profileId;
    acc.birthYear = profile.birthYear ?? acc.birthYear;
    acc.noticesOptIn = profile.noticesOptIn ?? acc.noticesOptIn;
    acc.hasPhoto = profile.hasPhoto ?? acc.hasPhoto;
    acc.photoUpdatedAt = profile.photoUpdatedAt ?? acc.photoUpdatedAt;
  }

  for (const profile of input.profiles) {
    applyProfile(playerAcc(profile.nicknameNormalized, profile.nickname), profile);
  }

  for (const round of rounds) {
    const when = round.startedAt ?? round.completedAt;
    const ymd = pragueYmd(when);
    const dateKey = ymdKey(ymd);
    const dow = pragueWeekday(when);
    const hour = pragueHour(when);
    const roster = playersByRound.get(round.id) ?? [];
    const gameType = isGameType(round.gameType) ? round.gameType : "fotbalgolf";
    const game = gameStats.get(gameType);
    if (game) game.rounds += 1;

    weekdays[dow - 1].rounds += 1;
    weekdays[dow - 1].players += roster.length;
    const hourSlot = hourIndex.get(hour);
    if (hourSlot != null) hours[hourSlot].rounds += 1;
    const heatKey = `${dow}:${hour}`;
    heat.set(heatKey, (heat.get(heatKey) ?? 0) + 1);

    const day = byDay.get(dateKey) ?? { rounds: 0, players: new Set<string>() };
    day.rounds += 1;

    const submitEmail = round.submittedByEmail ? normalizeEmail(round.submittedByEmail) : null;
    const submitName = round.submittedByName ? normalizePlayerName(round.submittedByName) : null;
    const dayPlayers: MarketingDayPlayer[] = [];

    for (const player of roster) {
      const acc = playerAcc(player.nameNormalized, player.name);
      acc.rounds += 1;
      acc.firstPlayedAt =
        !acc.firstPlayedAt || round.completedAt < acc.firstPlayedAt ? round.completedAt : acc.firstPlayedAt;
      acc.lastPlayedAt =
        !acc.lastPlayedAt || round.completedAt > acc.lastPlayedAt ? round.completedAt : acc.lastPlayedAt;
      acc.games.set(gameType, (acc.games.get(gameType) ?? 0) + 1);
      day.players.add(player.nameNormalized);
      game?.playerKeys.add(player.nameNormalized);

      const profile =
        profilesByNick.get(player.nameNormalized) ??
        (submitEmail && submitName === player.nameNormalized ? profilesByEmail.get(submitEmail) : undefined);
      if (profile) {
        applyProfile(acc, profile);
      } else if (!acc.email && submitEmail && submitName === player.nameNormalized) {
        acc.email = round.submittedByEmail;
      }

      const vs = playerVsPar(round, player, holes, pars);
      acc.history.push({
        date: dateKey,
        gameType,
        label: GAME_LABELS[gameType],
        total: player.total,
        vsPar: vs,
      });
      dayPlayers.push({
        name: acc.nickname,
        total: player.total,
        vsPar: vs,
        email: acc.email,
        firstVisit: acc.rounds === 1,
      });
      if (vs != null) {
        acc.vs.push(vs);
        allVs.push(vs);
        game?.vs.push(vs);
        const bucket = vsParBucket(vs);
        const current = buckets.get(bucket.id) ?? { ...bucket, count: 0 };
        current.count += 1;
        buckets.set(bucket.id, current);
        if (game && (game.bestVsPar == null || vs < game.bestVsPar)) {
          game.bestVsPar = vs;
          game.bestPlayer = player.name;
        }
      }
    }

    byDay.set(dateKey, day);
    const dayRounds = byDayRounds.get(dateKey) ?? [];
    const minutes = Math.max(
      1,
      Math.round((round.completedAt.getTime() - round.startedAt.getTime()) / 60_000),
    );
    dayPlayers.sort((a, b) => {
      if (a.vsPar != null && b.vsPar != null && a.vsPar !== b.vsPar) return a.vsPar - b.vsPar;
      return a.total - b.total;
    });
    dayRounds.push({
      id: round.id,
      gameType,
      label: GAME_LABELS[gameType],
      format: FORMAT_LABELS[round.format ?? ""] ?? round.format ?? "",
      startedAt: round.startedAt.toISOString(),
      completedAt: round.completedAt.toISOString(),
      hour,
      minutes,
      finishedEarly: round.finishedEarly,
      players: dayPlayers,
    });
    byDayRounds.set(dateKey, dayRounds);
  }

  const games: MarketingGameStat[] = gameTypes.map((gameType) => {
    const stat = gameStats.get(gameType)!;
    return {
      gameType,
      label: GAME_LABELS[gameType],
      rounds: stat.rounds,
      players: stat.playerKeys.size,
      avgVsPar: roundAvg(stat.vs),
      bestVsPar: stat.bestVsPar,
      bestPlayer: stat.bestPlayer,
    };
  });

  const peakWeekday = [...weekdays].sort((a, b) => b.rounds - a.rounds)[0];
  const peakHour = [...hours].sort((a, b) => b.rounds - a.rounds)[0];
  const favoriteGame = [...games].sort((a, b) => b.rounds - a.rounds)[0];

  const today = pragueYmd(now);
  const months: MarketingCalendarMonth[] = [];
  for (let offset = CALENDAR_MONTHS - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(today.year, today.month - 1 - offset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const first: MarketingYmd = { year, month, day: 1 };
    const start = mondayOnOrBefore(first);
    const lastDay = daysInMonth(year, month);
    const end = addDays({ year, month, day: lastDay }, 7 - isoDowFromYmd({ year, month, day: lastDay }));
    const days: MarketingCalendarDay[] = [];
    for (let cursorDay = start; ymdKey(cursorDay) <= ymdKey(end); cursorDay = addDays(cursorDay, 1)) {
      const key = ymdKey(cursorDay);
      const stats = byDay.get(key);
      days.push({
        date: key,
        weekday: isoDowFromYmd(cursorDay),
        inMonth: cursorDay.month === month,
        rounds: stats?.rounds ?? 0,
        players: stats?.players.size ?? 0,
      });
      if (days.length > 42) break;
    }
    months.push({
      year,
      month,
      label: `${MONTH_LABELS[month - 1]} ${year}`,
      days,
    });
  }

  const hourHeatmap: MarketingHeatCell[] = [];
  for (const weekday of weekdays) {
    for (const hour of hours) {
      hourHeatmap.push({
        dow: weekday.dow,
        hour: hour.hour,
        rounds: heat.get(`${weekday.dow}:${hour.hour}`) ?? 0,
      });
    }
  }

  const playerList: MarketingPlayer[] = [...byPlayer.values()]
    .map((acc) => {
      let favoriteGame: GameType | null = null;
      let favoriteCount = 0;
      for (const [gameType, count] of acc.games) {
        if (count > favoriteCount) {
          favoriteGame = gameType;
          favoriteCount = count;
        }
      }
      const gamesPlayed = gameTypes.filter((gameType) => (acc.games.get(gameType) ?? 0) > 0);
      const age = acc.birthYear != null ? pragueYmd(now).year - acc.birthYear : null;
      return {
        nickname: acc.nickname,
        name: acc.name,
        email: acc.email,
        platform: acc.platform,
        locale: acc.locale,
        profileId: acc.profileId,
        birthYear: acc.birthYear,
        age,
        noticesOptIn: acc.noticesOptIn,
        photoUrl:
          acc.profileId && acc.hasPhoto && acc.photoUpdatedAt
            ? profilePhotoPublicUrl(acc.profileId, acc.photoUpdatedAt)
            : null,
        rounds: acc.rounds,
        firstPlayedAt: acc.firstPlayedAt?.toISOString() ?? null,
        lastPlayedAt: acc.lastPlayedAt?.toISOString() ?? null,
        daysSinceLast: acc.lastPlayedAt ? daysSincePrague(acc.lastPlayedAt, now) : null,
        avgVsPar: roundAvg(acc.vs),
        favoriteGame,
        gamesPlayed,
        history: [...acc.history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
      };
    })
    .sort((a, b) => {
      if (b.rounds !== a.rounds) return b.rounds - a.rounds;
      return a.nickname.localeCompare(b.nickname, "cs");
    });

  const activePlayers = playerList.filter((player) => player.rounds > 0);
  const contactable = activePlayers.filter((player) => Boolean(player.email));
  const inboxable = contactable.filter((player) => player.noticesOptIn);
  const lapsed = contactable.filter(
    (player) => player.daysSinceLast != null && player.daysSinceLast >= LAPSED_AFTER_DAYS,
  );
  const regulars = contactable.filter((player) => player.rounds >= REGULAR_ROUNDS);
  const thisMonth = `${today.year}-${pad(today.month)}`;
  const newThisMonth = activePlayers.filter((player) => {
    if (!player.firstPlayedAt) return false;
    const first = pragueYmd(new Date(player.firstPlayedAt));
    return `${first.year}-${pad(first.month)}` === thisMonth;
  });

  const campaigns = buildCampaigns({
    players: activePlayers,
    peakWeekday: peakWeekday && peakWeekday.rounds > 0 ? peakWeekday : null,
    peakHour: peakHour && peakHour.rounds > 0 ? peakHour : null,
    lapsed,
    regulars,
    newThisMonth,
    contactable,
  });

  const languages = mixCounts(
    activePlayers.map((player) => player.locale),
    (id) => localeMixLabel(id),
  );
  const platforms = mixCounts(
    activePlayers.map((player) => player.platform),
    (id) => (id === "ios" ? "iPhone" : id === "android" ? "Android" : "Jiné"),
  );

  return {
    generatedAt: now.toISOString(),
    summary: {
      rounds: rounds.length,
      players: activePlayers.length,
      registered: playerList.filter((player) => Boolean(player.email)).length,
      contactable: contactable.length,
      inboxable: inboxable.length,
      lapsed: lapsed.length,
      regulars: regulars.length,
      newThisMonth: newThisMonth.length,
      peakWeekday: peakWeekday && peakWeekday.rounds > 0 ? peakWeekday : null,
      peakHour: peakHour && peakHour.rounds > 0 ? peakHour : null,
      favoriteGame: favoriteGame && favoriteGame.rounds > 0 ? favoriteGame : null,
    },
    campaigns,
    languages,
    platforms,
    games,
    vsPar: {
      avg: roundAvg(allVs),
      buckets: [...buckets.values()],
    },
    weekdays,
    hours,
    hourHeatmap,
    months,
    days: Object.fromEntries(
      [...byDayRounds.entries()].map(([date, items]) => [
        date,
        {
          date,
          rounds: items.sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
        },
      ]),
    ),
    players: playerList,
  };
}

export async function loadMarketingSnapshot(now = new Date()): Promise<MarketingSnapshot> {
  const [rounds, profiles, pars] = await Promise.all([
    db.select().from(scoreRounds),
    db
      .select({
        id: scoreProfiles.id,
        name: scoreProfiles.name,
        nickname: scoreProfiles.nickname,
        nicknameNormalized: scoreProfiles.nicknameNormalized,
        email: scoreProfiles.email,
        platform: scoreProfiles.platform,
        locale: scoreProfiles.locale,
        birthYear: scoreProfiles.birthYear,
        noticesOptIn: scoreProfiles.noticesOptIn,
        photoMime: scoreProfiles.photoMime,
        updatedAt: scoreProfiles.updatedAt,
      })
      .from(scoreProfiles),
    db
      .select({
        gameType: scoreCourseHoles.gameType,
        hole: scoreCourseHoles.hole,
        par: scoreCourseHoles.par,
      })
      .from(scoreCourseHoles),
  ]);

  const visibleIds = rounds.filter((round) => !round.hidden).map((round) => round.id);
  const [players, holes] =
    visibleIds.length > 0
      ? await Promise.all([
          db.select().from(scorePlayers).where(inArray(scorePlayers.roundId, visibleIds)),
          db.select().from(scoreHoleScores).where(inArray(scoreHoleScores.roundId, visibleIds)),
        ])
      : [[], []];

  return buildMarketingSnapshot({
    now,
    rounds,
    players,
    holes,
    profiles: profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      nickname: profile.nickname,
      nicknameNormalized: profile.nicknameNormalized,
      email: profile.email,
      platform: profile.platform,
      locale: profile.locale,
      birthYear: profile.birthYear,
      noticesOptIn: profile.noticesOptIn,
      hasPhoto: Boolean(profile.photoMime),
      photoUpdatedAt: profile.updatedAt,
    })),
    pars,
  });
}

export async function rememberProfileDevice(input: {
  email?: string;
  platform?: string;
  locale?: string;
}): Promise<void> {
  const email = input.email?.trim();
  if (!email || (!input.platform && !input.locale)) return;

  const patch: { platform?: string; locale?: string; updatedAt: Date } = { updatedAt: new Date() };
  if (input.platform) patch.platform = input.platform;
  if (input.locale) patch.locale = input.locale;

  await db
    .update(scoreProfiles)
    .set(patch)
    .where(eq(scoreProfiles.emailNormalized, normalizeEmail(email)));
}
