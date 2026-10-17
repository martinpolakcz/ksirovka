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

export function AdminCoursePage() {
  const queryClient = useQueryClient();
  const [gameType, setGameType] = useState<ScoreGameType>("fotbalgolf");
  const [message, setMessage] = useState("");

  const courseQuery = useQuery({
    queryKey: ["admin-course"],
    queryFn: () => api.getAdminCourse(),
  });

  const patchMutation = useMutation({
    mutationFn: (payload: { gameType: ScoreGameType; hole: number; closed?: boolean; par?: number }) =>
      api.patchAdminCourse(payload),
    onSuccess: async () => {
      setMessage("Jamka je uložená.");
      await queryClient.invalidateQueries({ queryKey: ["admin-course"] });
      await queryClient.invalidateQueries({ queryKey: ["scorecard-stats"] });
    },
    onError: redirectIfUnauthorized,
  });

  const holes: CourseHole[] = courseQuery.data?.games[gameType] ?? [];
  const openCount = holes.filter((hole) => !hole.closed).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl">Jamky</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Vypni jamku v rekonstrukci. Oficiální žebříček bere jen kola se skóre na všech právě otevřených
        jamkách. Přeskočená otevřená jamka během hry kolo z oficiálu vyřadí.
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
        Otevřeno {openCount} z {holes.length || 20} jamek · par {holes.filter((h) => !h.closed).reduce((s, h) => s + h.par, 0) || 40}
      </p>
      {message ? <p className="mt-2 text-sm text-teal">{message}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/50">
            <tr>
              <th className="px-4 py-3">Jamka</th>
              <th className="px-4 py-3">Par</th>
              <th className="px-4 py-3">Stav</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole) => (
              <tr key={hole.hole} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium">{hole.hole}</td>
                <td className="px-4 py-3">{hole.par}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hole.closed}
                      onChange={(event) =>
                        patchMutation.mutate({
                          gameType,
                          hole: hole.hole,
                          closed: event.target.checked,
                        })
                      }
                    />
                    v rekonstrukci
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
