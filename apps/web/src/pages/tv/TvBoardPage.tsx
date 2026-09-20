import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, isStaticOnly, type ScoreGameType } from "@/lib/api";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { cn } from "@/lib/utils";
import { Celebration } from "./Celebration";
import { EmptyMorning } from "./EmptyMorning";
import { FeaturedAd } from "./FeaturedAd";
import { FullscreenAd } from "./FullscreenAd";
import { LegendChallenge } from "./LegendChallenge";
import { PeriodWipe } from "./PeriodWipe";
import { Podium } from "./Podium";
import { QrInvite } from "./QrInvite";
import { StoryStats } from "./StoryStats";
import { Ticker } from "./Ticker";
import {
  CELEBRATION_MS,
  CELEBRATION_RECORD_MS,
  FEATURED_ROTATE_MS,
  FULLSCREEN_AD_EVERY_MS,
  FULLSCREEN_AD_MS,
  GAME_COLORS,
  GAME_LABELS,
  MIDDLE_PANELS,
  PANEL_ROTATE_MS,
  PERIOD_LABELS,
  SCENE_ROTATE_MS,
  STATS_POLL_MS,
  TV_GAMES,
  TV_PERIODS,
  TV_SCENES,
  findSceneIndex,
  type CelebrationRound,
  type MiddlePanel,
  type TvPeriod,
} from "./tv-shared";
import { useKiosk, usePrefersReducedMotion, useWideViewport } from "./useKiosk";

function formatClock(date: Date) {
  return date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

export function TvBoardPage() {
  useDocumentMeta({
    title: "TV tabule",
    description: "Živé výsledky Kšírovky na velkou obrazovku.",
  });
  useKiosk();
  const wide = useWideViewport();
  const reducedMotion = usePrefersReducedMotion();

  const [sceneIndex, setSceneIndex] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [panel, setPanel] = useState<MiddlePanel>("story");
  const [now, setNow] = useState(() => new Date());
  const [wipe, setWipe] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationRound | null>(null);
  const [fullscreenAd, setFullscreenAd] = useState(false);
  const seenRoundIds = useRef(new Set<number>());
  const boardPrimed = useRef(false);
  const dayBestByGame = useRef<Partial<Record<ScoreGameType, number>>>({});
  const pendingAd = useRef(false);
  const celebrationRef = useRef<CelebrationRound | null>(null);
  celebrationRef.current = celebration;

  const scene = TV_SCENES[sceneIndex] ?? TV_SCENES[0];
  const period = scene.period;
  const gameType = scene.gameType;

  const statsQuery = useQuery({
    queryKey: ["scorecard-stats", period, gameType, "tv"],
    queryFn: () => api.getScorecardStats(period, gameType),
    refetchInterval: STATS_POLL_MS,
    staleTime: 0,
    placeholderData: (previous) => previous,
    enabled: !isStaticOnly,
  });

  const dayPulseQuery = useQuery({
    queryKey: ["scorecard-stats", "day", "all", "tv-pulse"],
    queryFn: () => api.getScorecardStats("day"),
    refetchInterval: STATS_POLL_MS,
    staleTime: 0,
    enabled: !isStaticOnly,
  });

  const boardQuery = useQuery({
    queryKey: ["tv-board"],
    queryFn: () => api.getTvBoard(),
    refetchInterval: STATS_POLL_MS,
    enabled: !isStaticOnly,
  });

  const stats = statsQuery.data;
  const dayPulse = dayPulseQuery.data;
  const featured = boardQuery.data?.promos.featured ?? [];
  const tickerPromos = boardQuery.data?.promos.ticker ?? [];
  const emptyBoard = stats != null && stats.summary.rounds === 0;

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % TV_SCENES.length);
      if (wide) {
        setWipe(true);
        window.setTimeout(() => setWipe(false), 700);
      }
    }, SCENE_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, wide]);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => {
      setFeaturedIndex((index) => (index + 1) % featured.length);
    }, FEATURED_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [featured.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPanel((current) => MIDDLE_PANELS[(MIDDLE_PANELS.indexOf(current) + 1) % MIDDLE_PANELS.length]);
    }, PANEL_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (featured.length === 0 || reducedMotion || !wide) return;
    const timer = window.setInterval(() => {
      if (celebrationRef.current) {
        pendingAd.current = true;
        return;
      }
      setFullscreenAd(true);
    }, FULLSCREEN_AD_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [featured.length, reducedMotion, wide]);

  useEffect(() => {
    if (!fullscreenAd) return;
    const timer = window.setTimeout(() => setFullscreenAd(false), FULLSCREEN_AD_MS);
    return () => window.clearTimeout(timer);
  }, [fullscreenAd]);

  useEffect(() => {
    if (!dayPulse) return;

    if (!boardPrimed.current) {
      for (const row of dayPulse.playerLeaderboard) {
        const current = dayBestByGame.current[row.gameType];
        if (current == null || row.bestTotal < current) {
          dayBestByGame.current[row.gameType] = row.bestTotal;
        }
      }
      for (const round of dayPulse.recentRounds) {
        seenRoundIds.current.add(round.id);
      }
      boardPrimed.current = true;
      return;
    }

    const latest = dayPulse.recentRounds.find((round) => !round.finishedEarly);
    if (!latest || seenRoundIds.current.has(latest.id)) {
      for (const row of dayPulse.playerLeaderboard) {
        const current = dayBestByGame.current[row.gameType];
        if (current == null || row.bestTotal < current) {
          dayBestByGame.current[row.gameType] = row.bestTotal;
        }
      }
      return;
    }

    seenRoundIds.current.add(latest.id);
    const previousBest = dayBestByGame.current[latest.gameType];
    const second = latest.standings.find((player) => player.rank > 1) ?? latest.standings[1];
    if (wide) setFullscreenAd(false);
    setCelebration({
      ...latest,
      isRecord: previousBest != null && latest.winnerTotal < previousBest,
      isFirstToday: previousBest == null,
      gap: second ? Math.max(0, second.total - latest.winnerTotal) : null,
    });

    for (const row of dayPulse.playerLeaderboard) {
      const current = dayBestByGame.current[row.gameType];
      if (current == null || row.bestTotal < current) {
        dayBestByGame.current[row.gameType] = row.bestTotal;
      }
    }
  }, [dayPulse]);

  useEffect(() => {
    if (!celebration) {
      if (wide && pendingAd.current && featured.length > 0) {
        pendingAd.current = false;
        setFullscreenAd(true);
      }
      return;
    }
    const hold = celebration.isRecord ? CELEBRATION_RECORD_MS : CELEBRATION_MS;
    const timer = window.setTimeout(() => setCelebration(null), hold);
    return () => window.clearTimeout(timer);
  }, [celebration, featured.length, wide]);

  const rest = useMemo(() => stats?.playerLeaderboard.slice(3, 10) ?? [], [stats]);
  const hardest = useMemo(() => stats?.hardestHoles.slice(0, 3) ?? [], [stats]);
  const recent = dayPulse?.recentRounds.slice(0, 3) ?? [];
  const sceneBest = stats?.playerLeaderboard[0];
  const activeAd = featured[featuredIndex % Math.max(featured.length, 1)];

  function selectGame(nextGame: ScoreGameType) {
    setSceneIndex(findSceneIndex(period, nextGame));
  }

  function selectPeriod(nextPeriod: TvPeriod) {
    setSceneIndex(findSceneIndex(nextPeriod, gameType));
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-mist text-ink lg:h-[100dvh] lg:overflow-hidden">
      {wide && !reducedMotion && <PeriodWipe period={period} gameType={gameType} visible={wipe} />}
      {wide && <Celebration round={celebration} reducedMotion={reducedMotion} />}
      {wide && <FullscreenAd promo={fullscreenAd ? (activeAd ?? null) : null} reducedMotion={reducedMotion} />}

      <header className="relative z-10 flex flex-col gap-3 px-4 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <img src="/logo-wordmark.svg" alt="Kšírovka" className="h-8 w-auto lg:h-10 xl:h-12" />
          <p className="text-2xl font-semibold text-teal tabular-nums lg:hidden">{formatClock(now)}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 lg:gap-2">
            {TV_GAMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectGame(item)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold text-white lg:px-4 lg:text-base",
                  gameType === item ? "opacity-100" : "opacity-45",
                )}
                style={{ backgroundColor: GAME_COLORS[item] }}
              >
                {GAME_LABELS[item]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 lg:gap-2">
            {TV_PERIODS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectPeriod(item)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm",
                  period === item ? "bg-teal text-white" : "text-ink/40",
                )}
              >
                {PERIOD_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        <p className="hidden justify-self-end text-4xl font-semibold text-teal tabular-nums lg:block">
          {formatClock(now)}
        </p>
      </header>

      <main className="relative z-10 flex flex-col gap-4 px-4 pb-3 lg:grid lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-5 lg:px-6">
        <section className="shrink-0 lg:min-h-0 lg:shrink">
          {emptyBoard ? (
            <EmptyMorning gameType={gameType} />
          ) : (
            <Podium
              leaderboard={stats?.playerLeaderboard ?? []}
              reducedMotion={reducedMotion}
              compact={!wide}
            />
          )}
        </section>

        <section className="grid shrink-0 grid-cols-1 gap-4 lg:min-h-0 lg:shrink lg:grid-cols-3 lg:gap-5">
          <div className="tv-card flex flex-col p-4 lg:min-h-0 lg:p-5">
            <p className="text-sm font-semibold text-teal">
              {GAME_LABELS[gameType]} · {PERIOD_LABELS[period]} · 4–10
            </p>
            <ol className="mt-3 space-y-2 lg:min-h-0 lg:overflow-hidden">
              {rest.length === 0 && <li className="text-ink/45">Další jména se sem teprve dopíšou.</li>}
              {rest.map((row) => (
                <li key={`${row.playerName}-${row.gameType}`} className="flex items-center gap-3">
                  <span className="w-7 text-xl font-semibold text-teal lg:w-8 lg:text-2xl">{row.rank}</span>
                  <span className="min-w-0 flex-1 truncate text-base lg:text-lg">{row.playerName}</span>
                  <span className="text-xl font-semibold text-ink lg:text-2xl">{row.bestTotal}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-4 lg:min-h-0">
            <div className="tv-card p-4 lg:p-5">
              <p className="text-sm font-semibold text-teal">Právě dohráli</p>
              <ul className="mt-3 space-y-2">
                {recent.length === 0 && <li className="text-ink/45">První kolo dne ještě padne.</li>}
                {recent.map((round) => (
                  <li key={round.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{round.winnerName}</span>
                    <span className="text-sm text-ink/45">{GAME_LABELS[round.gameType]}</span>
                    <span className="text-xl font-semibold text-orange lg:text-2xl">{round.winnerTotal}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tv-card min-h-0 flex-1 p-4 lg:p-5">
              {panel === "story" && dayPulse && <StoryStats summary={dayPulse.summary} />}
              {panel === "legend" && (
                <LegendChallenge
                  gameType={gameType}
                  bestTotal={sceneBest?.bestTotal ?? null}
                  bestName={sceneBest?.playerName ?? null}
                />
              )}
              {panel === "hardest" && (
                <div>
                  <p className="text-sm font-semibold text-teal">Nejtěžší jamky</p>
                  <ul className="mt-3 space-y-2">
                    {hardest.length === 0 && <li className="text-ink/45">Jamky se ještě zahřívají.</li>}
                    {hardest.map((hole) => (
                      <li key={`${hole.gameType}-${hole.hole}`} className="flex items-center justify-between">
                        <span>
                          Jamka {hole.hole}
                          <span className="ml-2 text-sm text-ink/40">{GAME_LABELS[hole.gameType]}</span>
                        </span>
                        <span className="text-xl font-semibold text-orange lg:text-2xl">
                          {hole.vsPar > 0 ? `+${hole.vsPar}` : hole.vsPar === 0 ? "E" : hole.vsPar}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:min-h-0">
            {!emptyBoard && <QrInvite />}
            <FeaturedAd promo={activeAd} reducedMotion={reducedMotion} />
          </div>
        </section>
      </main>

      <Ticker promos={tickerPromos} recent={dayPulse?.recentRounds ?? []} />
    </div>
  );
}
