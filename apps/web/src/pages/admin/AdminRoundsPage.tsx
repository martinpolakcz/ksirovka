import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api, type AdminTvDataSettingsInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

function redirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    window.location.href = "/admin/login";
  }
}

function formatWhen(iso: string | null) {
  if (!iso) return "ještě ne";
  return new Date(iso).toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminRoundsPage() {
  const queryClient = useQueryClient();
  const [retentionEnabled, setRetentionEnabled] = useState(false);
  const [runHour, setRunHour] = useState(3);
  const [message, setMessage] = useState("");

  const roundsQuery = useQuery({
    queryKey: ["admin-rounds"],
    queryFn: () => api.getAdminRounds(80),
  });

  const tvDataQuery = useQuery({
    queryKey: ["admin-tv-data"],
    queryFn: () => api.getAdminTvData(),
  });

  useEffect(() => {
    const settings = tvDataQuery.data?.settings;
    if (!settings) return;
    setRetentionEnabled(settings.retentionEnabled);
    setRunHour(settings.runHour);
  }, [tvDataQuery.data]);

  async function refreshBoard() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-rounds"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-tv-data"] }),
      queryClient.invalidateQueries({ queryKey: ["scorecard-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["tv-board"] }),
    ]);
  }

  const hideMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) => api.hideAdminRound(id, hidden),
    onSuccess: async () => {
      await refreshBoard();
    },
    onError: redirectIfUnauthorized,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAdminRound(id),
    onSuccess: async () => {
      setMessage("Kolo je smazané.");
      await refreshBoard();
    },
    onError: redirectIfUnauthorized,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminTvDataSettingsInput) => api.saveAdminTvData(payload),
    onSuccess: async () => {
      setMessage("Noční vyčištění pódia je uložené.");
      await refreshBoard();
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      setMessage(error instanceof Error ? error.message : "Uložení se nepovedlo");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetAdminTvPodium(),
    onSuccess: async () => {
      setMessage("Pódium na TV je prázdné. 4.–10. místo a Právě dohráli zůstaly.");
      await refreshBoard();
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      setMessage(error instanceof Error ? error.message : "Vyčištění se nepovedlo");
    },
  });

  const items = roundsQuery.data?.items ?? [];
  const counts = tvDataQuery.data?.counts;
  const settings = tvDataQuery.data?.settings;
  const busy =
    hideMutation.isPending || deleteMutation.isPending || saveMutation.isPending || resetMutation.isPending;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section>
        <h1 className="font-display text-4xl">Kola</h1>
        <p className="mt-2 text-ink/50">
          Schovej nevhodné jméno, nebo smaž jedno kolo. Hromadné mazání už není — strategie a fotky zůstanou.
        </p>

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
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={round.hidden ? "default" : "outline"}
                  size="sm"
                  disabled={busy}
                  onClick={() => hideMutation.mutate({ id: round.id, hidden: !round.hidden })}
                >
                  {round.hidden ? "Znovu ukázat" : "Schovat"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Smazat kolo ${round.winnerName || round.id}? Tohle nejde vrátit.`)) return;
                    deleteMutation.mutate(round.id);
                  }}
                >
                  Smazat
                </Button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="px-5 py-10 text-ink/50">Zatím žádná odeslaná kola.</li>}
        </ul>
      </section>

      <div className="space-y-6">
        <form
          className="rounded-[2rem] bg-mist p-6"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("");
            saveMutation.mutate({ retentionEnabled, runHour });
          }}
        >
          <h2 className="font-display text-3xl">Noční pódium</h2>
          <p className="mt-2 text-sm text-ink/50">
            Jednou denně v zvolenou hodinu (čas Praha) se na TV vyčistí jen 1., 2. a 3. místo. Kola se nemažou.
          </p>

          <label className="mt-5 flex items-center gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={retentionEnabled}
              onChange={(event) => setRetentionEnabled(event.target.checked)}
              className="size-4 accent-teal"
            />
            Zapnout noční vyčištění pódia
          </label>

          <label className="mt-4 block text-sm text-ink/70">
            Spouštět v
            <select
              value={runHour}
              onChange={(event) => setRunHour(Number(event.target.value))}
              className="mt-2 h-11 w-full rounded-full bg-white px-4 text-ink ring-1 ring-ink/10"
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {`${String(hour).padStart(2, "0")}:00`}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-4 text-sm text-ink/45">
            {settings
              ? `Naposledy vyčištěno ${formatWhen(settings.lastPurgeAt)}.`
              : "Načítám stav cronu…"}
          </p>
          {settings?.podiumSince && (
            <p className="mt-1 text-sm text-ink/45">Medaile berou kola od {formatWhen(settings.podiumSince)}.</p>
          )}
          {counts && (
            <p className="mt-1 text-sm text-ink/45">
              Kola v databázi: {counts.total} · dnes {counts.today}.
            </p>
          )}

          <Button type="submit" className="mt-5" disabled={busy}>
            Uložit cron
          </Button>
        </form>

        <section className="rounded-[2rem] bg-mist p-6">
          <h2 className="font-display text-3xl">Vyčistit teď</h2>
          <p className="mt-2 text-sm text-ink/50">
            Tři medaile na TV budou prázdné, dokud někdo znovu nedohraje. 4.–10. místo, Právě dohráli, strategie a
            fotky zůstanou.
          </p>
          <Button
            type="button"
            className="mt-5"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Vyčistit 1., 2. a 3. místo na TV?")) return;
              setMessage("");
              resetMutation.mutate();
            }}
          >
            Vyčistit pódium
          </Button>
        </section>

        {message && <p className="px-2 text-sm text-teal">{message}</p>}
      </div>
    </div>
  );
}
