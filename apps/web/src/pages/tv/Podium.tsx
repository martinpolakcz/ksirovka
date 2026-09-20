import { motion } from "framer-motion";
import type { ScorecardStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { GAME_LABELS } from "./tv-shared";

const PLACE_META = [
  { place: 2, medal: "🥈", height: "h-auto lg:h-[78%]", order: "order-2 lg:order-1", bg: "bg-white", accent: "text-[#8a8a8a]" },
  { place: 1, medal: "🥇", height: "h-auto lg:h-full", order: "order-1 lg:order-2", bg: "bg-teal", accent: "text-white" },
  { place: 3, medal: "🥉", height: "h-auto lg:h-[70%]", order: "order-3", bg: "bg-white", accent: "text-[#cd7f32]" },
] as const;

type PodiumProps = {
  leaderboard: ScorecardStats["playerLeaderboard"];
  reducedMotion: boolean;
  compact?: boolean;
};

export function Podium({ leaderboard, reducedMotion, compact = false }: PodiumProps) {
  return (
    <div className="flex flex-col gap-3 lg:grid lg:h-full lg:grid-cols-3 lg:items-end lg:gap-4 xl:gap-8">
      {PLACE_META.map((meta, index) => {
        const row = leaderboard.find((item) => item.rank === meta.place);
        const first = meta.place === 1;
        return (
          <motion.article
            key={meta.place}
            initial={reducedMotion || compact ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
            className={cn(
              "relative flex flex-col justify-between rounded-[1.6rem] px-5 py-5 shadow-[0_12px_40px_rgba(14,173,167,0.12)] lg:rounded-[2rem] lg:px-7 lg:py-8",
              meta.height,
              meta.order,
              meta.bg,
              first ? "text-white" : "text-ink ring-1 ring-ink/10",
            )}
          >
            <p className="text-3xl leading-none lg:text-5xl">{meta.medal}</p>
            <div>
              <p
                className={cn(
                  "font-semibold leading-tight",
                  first ? "text-3xl lg:text-5xl xl:text-7xl" : "text-2xl lg:text-3xl xl:text-5xl",
                )}
              >
                {row?.playerName ?? "Čekáme"}
              </p>
              <p className={cn("mt-1 text-sm lg:mt-2", first ? "text-white/70" : "text-ink/45")}>
                {row ? GAME_LABELS[row.gameType] : "na hrdinu"}
              </p>
              <p
                className={cn(
                  "mt-3 font-semibold leading-none lg:mt-4",
                  first ? "text-4xl text-white lg:text-6xl xl:text-8xl" : cn("text-3xl lg:text-4xl xl:text-6xl", meta.accent),
                )}
              >
                {row?.bestTotal ?? "—"}
              </p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
