import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api, type AdminTvDataPurgeInput, type AdminTvDataSettingsInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

function redirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    window.location.href = "/admin/login";
  }
}

function formatLastPurge(iso: string | null, deleted: number) {
  if (!iso) return "Cron ještě neběžel.";
  return `Poslední běh ${new Date(iso).toLocaleString("cs-CZ")} · smazáno ${deleted} ${roundsLabel(deleted)}.`;
}

function roundsLabel(count: number) {
  if (count === 1) return "kolo";
  if (count >= 2 && count <= 4) return "kola";
  return "kol";
}

export function AdminRoundsPage() {
  const queryClient = useQueryClient();
  const [retentionEnabled, setRetentionEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [runHour, setRunHour] = useState(3);
  const [manualDays, setManualDays] = useState(30);
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
    setRetentionDays(settings.retentionDays);
    setRunHour(settings.runHour);
    setManualDays(settings.retentionDays);
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
      setMessage("Nastavení cronu je uložené.");
      await refreshBoard();
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      setMessage(error instanceof Error ? error.message : "Uložení se nepovedlo");
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (payload: AdminTvDataPurgeInput) => api.purgeAdminTvData(payload),
    onSuccess: async (result) => {
      setMessage(`Smazáno ${result.deleted} ${roundsLabel(result.deleted)}.`);
      await refreshBoard();
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      setMessage(error instanceof Error ? error.message : "Mazání se nepovedlo");
    },
  });

  const items = roundsQuery.data?.items ?? [];
  const counts = tvDataQuery.data?.counts;
  const settings = tvDataQuery.data?.settings;
  const busy = hideMutation.isPending || deleteMutation.isPending || saveMutation.isPending || purgeMutation.isPending;

  function confirmPurge(question: string, payload: AdminTvDataPurgeInput) {
    if (!window.confirm(question)) return;
    setMessage("");
    purgeMutation.mutate(payload);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section>
        <h1 className="font-display text-4xl">Kola</h1>
        <p className="mt-2 text-ink/50">
          Schovej nevhodné jméno, nebo kolo smaž. Zmizí z TV i z veřejných výsledků.
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
            saveMutation.mutate({ retentionEnabled, retentionDays, runHour });
          }}
        >
          <h2 className="font-display text-3xl">Automatické mazání</h2>
          <p className="mt-2 text-sm text-ink/50">
            API to spustí samo jednou denně v zvolenou hodinu (čas Praha). Maže kola starší než nastavený počet dní.
          </p>

          <label className="mt-5 flex items-center gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={retentionEnabled}
              onChange={(event) => setRetentionEnabled(event.target.checked)}
              className="size-4 accent-teal"
            />
            Zapnout noční mazání
          </label>

          <label className="mt-4 block text-sm text-ink/70">
            Ponechat posledních dní
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDays}
              onChange={(event) => setRetentionDays(Number(event.target.value) || 1)}
              className="mt-2 h-11 w-full rounded-full bg-white px-4 text-ink ring-1 ring-ink/10"
            />
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
            {settings ? formatLastPurge(settings.lastPurgeAt, settings.lastPurgeDeleted) : "Načítám stav cronu…"}
          </p>
          {counts && (
            <p className="mt-1 text-sm text-ink/45">
              Celkem {counts.total} · dnes {counts.today} · starších než {retentionDays} dní {counts.olderThanRetention}.
            </p>
          )}

          <Button type="submit" className="mt-5" disabled={busy}>
            Uložit cron
          </Button>
        </form>

        <section className="rounded-[2rem] bg-mist p-6">
          <h2 className="font-display text-3xl">Smazat ručně</h2>
          <p className="mt-2 text-sm text-ink/50">Maže se natrvalo, včetně jamek. Záloha to nevrátí sama.</p>

          <label className="mt-5 block text-sm text-ink/70">
            Starší než dní
            <input
              type="number"
              min={1}
              max={3650}
              value={manualDays}
              onChange={(event) => setManualDays(Number(event.target.value) || 1)}
              className="mt-2 h-11 w-full rounded-full bg-white px-4 text-ink ring-1 ring-ink/10"
            />
          </label>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                confirmPurge(
                  `Smazat kola starší než ${manualDays} dní?`,
                  { scope: "older_than", days: manualDays },
                )
              }
            >
              Smazat starší kola
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                confirmPurge(
                  `Smazat dnešních ${counts?.today ?? 0} ${roundsLabel(counts?.today ?? 0)}?`,
                  { scope: "today" },
                )
              }
            >
              Smazat dnešní kola
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                confirmPurge(`Smazat všechna kola (${counts?.total ?? 0})? Tohle nejde vrátit.`, { scope: "all" })
              }
            >
              Smazat všechna kola
            </Button>
          </div>
        </section>

        {message && <p className="px-2 text-sm text-teal">{message}</p>}
      </div>
    </div>
  );
}
