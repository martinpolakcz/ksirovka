import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

export function AdminRoundsPage() {
  const queryClient = useQueryClient();
  const roundsQuery = useQuery({
    queryKey: ["admin-rounds"],
    queryFn: () => api.getAdminRounds(80),
  });

  const hideMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) => api.hideAdminRound(id, hidden),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-rounds"] }),
        queryClient.invalidateQueries({ queryKey: ["scorecard-stats"] }),
      ]);
    },
    onError: (error) => {
      if (error instanceof AdminAuthError) {
        window.location.href = "/admin/login";
      }
    },
  });

  const items = roundsQuery.data?.items ?? [];

  return (
    <section>
      <h1 className="font-display text-4xl">Kola</h1>
      <p className="mt-2 text-ink/50">Schovej nevhodné jméno. Zmizí z TV i z veřejných výsledků.</p>

      <ul className="mt-6 divide-y divide-ink/5 rounded-[2rem] bg-mist">
        {items.map((round) => (
          <li key={round.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {round.winnerName || "Bez vítěze"} · {round.winnerTotal || "—"}
                {round.hidden && <span className="ml-2 text-xs text-orange">skryté</span>}
              </p>
              <p className="truncate text-sm text-ink/45">
                {GAME_LABELS[round.gameType]} · {new Date(round.completedAt).toLocaleString("cs-CZ")} ·{" "}
                {round.playerNames.join(", ")}
              </p>
            </div>
            <Button
              type="button"
              variant={round.hidden ? "default" : "outline"}
              size="sm"
              disabled={hideMutation.isPending}
              onClick={() => hideMutation.mutate({ id: round.id, hidden: !round.hidden })}
            >
              {round.hidden ? "Znovu ukázat" : "Schovat"}
            </Button>
          </li>
        ))}
        {items.length === 0 && <li className="px-5 py-10 text-ink/50">Zatím žádná odeslaná kola.</li>}
      </ul>
    </section>
  );
}
