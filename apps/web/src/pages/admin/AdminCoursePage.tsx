import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api, type CourseHole, type ScoreGameType } from "@/lib/api";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

function redirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    window.location.href = "/admin/login";
  }
}

const GAMES: ScoreGameType[] = ["fotbalgolf", "minigolf", "adventure"];

function HoleEditor({
  gameType,
  hole,
  onSave,
  busy,
}: {
  gameType: ScoreGameType;
  hole: CourseHole;
  onSave: (payload: {
    gameType: ScoreGameType;
    hole: number;
    closed?: boolean;
    imageUrl?: string | null;
    tip?: string | null;
  }) => void;
  busy: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(hole.imageUrl ?? "");
  const [tip, setTip] = useState(hole.tip ?? "");

  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl">{hole.hole}</p>
          <p className="text-sm text-ink/50">par {hole.par}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hole.closed}
            disabled={busy}
            onChange={(event) =>
              onSave({ gameType, hole: hole.hole, closed: event.target.checked })
            }
          />
          v rekonstrukci
        </label>
      </div>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Plánek jamky ${hole.hole}`}
          className="mt-3 h-28 w-full rounded-xl object-cover bg-ink/5"
        />
      ) : (
        <div className="mt-3 flex h-28 items-center justify-center rounded-xl bg-ink/5 text-sm text-ink/40">
          Bez plánku
        </div>
      )}

      <label className="mt-3 block text-xs text-ink/50">
        URL plánku
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          onBlur={() => {
            const next = imageUrl.trim() || null;
            if (next === (hole.imageUrl ?? null)) return;
            onSave({ gameType, hole: hole.hole, imageUrl: next });
          }}
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </label>
      <label className="mt-3 block text-xs text-ink/50">
        Tip, jak se hraje
        <input
          value={tip}
          onChange={(event) => setTip(event.target.value)}
          onBlur={() => {
            const next = tip.trim() || null;
            if (next === (hole.tip ?? null)) return;
            onSave({ gameType, hole: hole.hole, tip: next });
          }}
          maxLength={160}
          placeholder="např. přes vodu zleva"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </label>
    </article>
  );
}

export function AdminCoursePage() {
  const queryClient = useQueryClient();
  const [gameType, setGameType] = useState<ScoreGameType>("fotbalgolf");
  const [message, setMessage] = useState("");

  const courseQuery = useQuery({
    queryKey: ["admin-course"],
    queryFn: () => api.getAdminCourse(),
  });

  const patchMutation = useMutation({
    mutationFn: (payload: {
      gameType: ScoreGameType;
      hole: number;
      closed?: boolean;
      par?: number;
      imageUrl?: string | null;
      tip?: string | null;
    }) => api.patchAdminCourse(payload),
    onSuccess: async () => {
      setMessage("Jamka je uložená.");
      await queryClient.invalidateQueries({ queryKey: ["admin-course"] });
      await queryClient.invalidateQueries({ queryKey: ["scorecard-stats"] });
    },
    onError: redirectIfUnauthorized,
  });

  const holes: CourseHole[] = courseQuery.data?.games[gameType] ?? [];
  const openCount = holes.filter((hole) => !hole.closed).length;
  const withPlan = holes.filter((hole) => hole.imageUrl).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl">Jamky</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Vypni jamku v rekonstrukci a u fotbalgolfu doplň plánek (URL fotky) a krátký tip. Appka si ho
        stáhne — do instalace se nepálí. Bez fotky zůstane jen zápis skóre.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {GAMES.map((game) => (
          <button
            key={game}
            type="button"
            onClick={() => setGameType(game)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              gameType === game ? "bg-orange text-white" : "text-ink/60 ring-1 ring-ink/15 hover:text-teal"
            }`}
          >
            {GAME_LABELS[game]}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink/60">
        Otevřeno {openCount} z {holes.length || 20} · plánků {withPlan} · par{" "}
        {holes.filter((h) => !h.closed).reduce((s, h) => s + h.par, 0) || 40}
      </p>
      {message ? <p className="mt-2 text-sm text-teal">{message}</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {holes.map((hole) => (
          <HoleEditor
            key={`${gameType}-${hole.hole}`}
            gameType={gameType}
            hole={hole}
            busy={patchMutation.isPending}
            onSave={(payload) => patchMutation.mutate(payload)}
          />
        ))}
      </div>
    </div>
  );
}
