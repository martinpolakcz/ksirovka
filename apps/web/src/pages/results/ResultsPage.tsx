import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/golf/PageHero";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  isStaticOnly,
  type ScoreGameType,
  type ScorePeriod,
  type ScorecardStats,
} from "@/lib/api";
import { assetUrl, cn } from "@/lib/utils";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const PERIODS: ScorePeriod[] = ["day", "week", "month"];
const GAME_TYPES: Array<ScoreGameType | "all"> = ["all", "fotbalgolf", "minigolf", "adventure"];

const GAME_LABELS: Record<ScoreGameType, string> = {
  fotbalgolf: "Fotbalgolf",
  minigolf: "Minigolf",
  adventure: "Adventure Golf",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function formatDate(isoDate: string, locale: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });
}

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vsParLabel(value: number) {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : String(value);
}

export function ResultsPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<ScorePeriod>("week");
  const [gameType, setGameType] = useState<ScoreGameType | "all">("all");

  useDocumentMeta({
    title: t("results.title"),
    description: t("results.subtitle"),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["scorecard-stats", period, gameType],
    queryFn: () => api.getScorecardStats(period, gameType),
    staleTime: 30_000,
    enabled: !isStaticOnly,
  });

  const locale = i18n.language.startsWith("cs") ? "cs-CZ" : i18n.language;
  const stats = data;

  return (
    <>
      <PageHero
        title={t("results.title")}
        subtitle={t("results.subtitle")}
        image={assetUrl("/user_uploads/submenu/obrazky/fotbalgolf.jpg")}
        category={t("results.category")}
      />

      <section className="border-t border-ink/5 bg-paper py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    period === item
                      ? "bg-orange text-white"
                      : "bg-mist text-ink/70 hover:bg-teal/10 hover:text-teal",
                  )}
                >
                  {t(`results.period.${item}`)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/tv"
                className="rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-teal ring-1 ring-teal/40 hover:bg-teal/10"
              >
                {t("results.tvMode")}
              </a>
              {GAME_TYPES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGameType(item)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition",
                    gameType === item
                      ? "bg-teal/10 text-teal ring-1 ring-teal/40"
                      : "text-ink/55 ring-1 ring-ink/10 hover:text-ink",
                  )}
                >
                  {item === "all" ? t("results.allGames") : GAME_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          {stats && (
            <p className="mt-4 text-sm text-ink/45">
              {t("results.fromTo", {
                from: formatDate(stats.from, locale),
                to: formatDate(stats.to, locale),
              })}
            </p>
          )}

          {isStaticOnly || isError ? (
            <EmptyState message={t("results.loadFailed")} />
          ) : isLoading ? (
            <LoadingState />
          ) : stats && stats.summary.rounds === 0 ? (
            <EmptyState message={t("results.empty")} />
          ) : stats ? (
            <StatsContent stats={stats} locale={locale} />
          ) : null}
        </div>
      </section>
    </>
  );
}

function StatsContent({ stats, locale }: { stats: ScorecardStats; locale: string }) {
  const { t } = useTranslation();
  const hardest = useMemo(() => stats.hardestHoles.slice(0, 3), [stats.hardestHoles]);

  return (
    <div className="mt-10 space-y-12">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label={t("results.rounds")} value={String(stats.summary.rounds)} />
        <SummaryCard label={t("results.players")} value={String(stats.summary.players)} />
        <SummaryCard
          label={t("results.bestScore")}
          value={stats.summary.bestScore ? String(stats.summary.bestScore.total) : "—"}
          hint={
            stats.summary.bestScore
              ? `${stats.summary.bestScore.playerName} · ${GAME_LABELS[stats.summary.bestScore.gameType]}`
              : undefined
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-mist p-6 md:p-8">
          <h2 className="font-display text-3xl font-semibold text-ink">{t("results.playerLeaderboard")}</h2>
          <p className="mt-1 text-sm text-ink/50">{t("results.playerLeaderboardHint")}</p>
          <ol className="mt-6 divide-y divide-ink/5">
            {stats.playerLeaderboard.map((row) => (
              <li key={`${row.playerName}-${row.gameType}-${row.rank}`} className="flex items-center gap-4 py-3">
                <span className="w-10 text-center font-display text-2xl text-teal">
                  {MEDALS[row.rank - 1] ?? row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{row.playerName}</p>
                  <p className="text-xs text-ink/45">
                    {GAME_LABELS[row.gameType]} · {row.rounds}{" "}
                    {row.rounds === 1 ? t("results.roundOne") : t("results.rounds")}
                    {row.rounds > 1 ? ` · Ø ${row.avgTotal}` : ""}
                  </p>
                </div>
                <span className="font-display text-3xl font-semibold text-teal">{row.bestTotal}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl bg-mist p-6 md:p-8">
            <h2 className="font-display text-3xl font-semibold text-ink">{t("results.hardestHoles")}</h2>
            <p className="mt-1 text-sm text-ink/50">{t("results.hardestHolesHint")}</p>
            <ol className="mt-6 space-y-3">
              {hardest.map((hole) => (
                <li
                  key={`${hole.gameType}-${hole.hole}`}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-ink">
                      {t("results.hole")} {hole.hole}
                      <span className="ml-2 text-sm text-ink/45">{GAME_LABELS[hole.gameType]}</span>
                    </p>
                    <p className="text-xs text-ink/40">
                      {t("results.par")} {hole.par} · Ø {hole.avgScore}
                    </p>
                  </div>
                  <span className="font-display text-2xl font-semibold text-teal">{vsParLabel(hole.vsPar)}</span>
                </li>
              ))}
              {hardest.length === 0 && (
                <p className="text-sm text-ink/45">{t("results.emptyHoles")}</p>
              )}
            </ol>
          </div>

          <div className="rounded-3xl bg-mist p-6 md:p-8">
            <h2 className="font-display text-3xl font-semibold text-ink">{t("results.holeLeaderboard")}</h2>
            <p className="mt-1 text-sm text-ink/50">{t("results.holeLeaderboardHint")}</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-teal">
                  <tr>
                    <th className="pb-3 font-medium">{t("results.hole")}</th>
                    <th className="pb-3 font-medium">{t("results.par")}</th>
                    <th className="pb-3 font-medium">{t("results.avg")}</th>
                    <th className="pb-3 font-medium">{t("results.best")}</th>
                    <th className="pb-3 font-medium">{t("results.plays")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 text-ink/80">
                  {stats.holeLeaderboard.map((hole) => (
                    <tr key={`${hole.gameType}-${hole.hole}`}>
                      <td className="py-2.5">
                        {hole.hole}
                        {stats.gameType == null && (
                          <span className="ml-2 text-xs text-ink/35">{GAME_LABELS[hole.gameType]}</span>
                        )}
                      </td>
                      <td className="py-2.5">{hole.par}</td>
                      <td className="py-2.5">
                        {hole.avgScore}{" "}
                        <span className="text-ink/40">{vsParLabel(hole.vsPar)}</span>
                      </td>
                      <td className="py-2.5">
                        {hole.bestScore}
                        <span className="ml-1 text-xs text-ink/40">{hole.bestPlayer}</span>
                      </td>
                      <td className="py-2.5">{hole.plays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-mist p-6 md:p-8">
        <h2 className="font-display text-3xl font-semibold text-ink">{t("results.recentRounds")}</h2>
        <ul className="mt-6 divide-y divide-ink/5">
          {stats.recentRounds.map((round) => (
            <li key={round.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-ink">
                  {GAME_LABELS[round.gameType]}
                  {round.finishedEarly && (
                    <span className="ml-2 text-xs text-orange">{t("results.earlyFinish")}</span>
                  )}
                </p>
                <p className="text-sm text-ink/45">
                  {formatDateTime(round.completedAt, locale)} · {round.playerCount} {t("results.players").toLowerCase()}
                </p>
              </div>
              <p className="text-sm text-teal">
                {t("results.winner")}: {round.winnerName} · {round.winnerTotal} {t("results.strokes")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-ink/40">{t("results.appHint")}</p>
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl bg-mist p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">{label}</p>
      <p className="mt-2 font-display text-5xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-2 text-sm text-ink/50">{hint}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-12 rounded-3xl bg-mist px-6 py-16 text-center">
      <p className="mx-auto max-w-lg text-lg text-ink/70">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-3xl" />
      ))}
    </div>
  );
}
