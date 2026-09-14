import { motion } from "framer-motion";
import type { ScorecardStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { GAME_LABELS } from "./tv-shared";

const PLACE_META = [
  { place: 2, medal: "🥈", height: "h-[78%]", bg: "bg-white", accent: "text-[#8a8a8a]" },
  { place: 1, medal: "🥇", height: "h-full", bg: "bg-teal", accent: "text-white" },
  { place: 3, medal: "🥉", height: "h-[70%]", bg: "bg-white", accent: "text-[#cd7f32]" },
] as const;

type PodiumProps = {
  leaderboard: ScorecardStats["playerLeaderboard"];
  reducedMotion: boolean;
};

export function Podium({ leaderboard, reducedMotion }: PodiumProps) {
  return (
    <div className="grid h-full grid-cols-3 items-end gap-4 xl:gap-8">
      {PLACE_META.map((meta, index) => {
        const row = leaderboard.find((item) => item.rank === meta.place);
        const first = meta.place === 1;
        return (
          <motion.article
            key={meta.place}
            initial={reducedMotion ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
            className={cn(
              "relative flex flex-col justify-between rounded-[2rem] px-5 py-6 shadow-[0_12px_40px_rgba(14,173,167,0.12)] md:px-7 md:py-8",
              meta.height,
              meta.bg,
              first ? "text-white" : "text-ink ring-1 ring-ink/10",
            )}
          >
            <p className="text-4xl leading-none md:text-5xl">{meta.medal}</p>
            <div>
              <p
                className={cn(
                  "font-semibold leading-tight",
                  first ? "text-5xl xl:text-7xl" : "text-3xl xl:text-5xl",
                )}
              >
                {row?.playerName ?? "Čekáme"}
              </p>
              <p className={cn("mt-2 text-sm", first ? "text-white/70" : "text-ink/45")}>
                {row ? GAME_LABELS[row.gameType] : "na hrdinu"}
              </p>
              <p
                className={cn(
                  "mt-4 font-semibold leading-none",
                  first ? "text-6xl text-white xl:text-8xl" : cn("text-4xl xl:text-6xl", meta.accent),
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
