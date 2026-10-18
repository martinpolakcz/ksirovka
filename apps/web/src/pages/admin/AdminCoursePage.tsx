import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api, type CourseHole, type ScoreGameType } from "@/lib/api";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

function redirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    window.location.href = "/admin/login";
  }
}

const GAMES: ScoreGameType[] = ["fotbalgolf", "minigolf", "adventure"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Soubor se nepodařilo přečíst"));
    reader.readAsDataURL(file);
  });
}

function HoleEditor({
  gameType,
  hole,
  onSave,
  onUpload,
  onRemoveImage,
  onToggleClosed,
  busy,
}: {
  gameType: ScoreGameType;
  hole: CourseHole;
  onSave: (payload: { tip: string | null; par: number }) => void;
  onUpload: (file: File) => void;
  onRemoveImage: () => void;
  onToggleClosed: (closed: boolean) => void;
  busy: boolean;
}) {
  const [tip, setTip] = useState(hole.tip ?? "");
  const [par, setPar] = useState(hole.par);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setTip(hole.tip ?? "");
  }, [hole.tip]);

  useEffect(() => {
    setPar(hole.par);
  }, [hole.par]);

  useEffect(() => {
    setPickedName(null);
    setPreview(null);
  }, [hole.imageUrl, hole.hole, gameType]);

  const shownImage = preview || hole.imageUrl;
  const nextPar = Number.isFinite(par) ? Math.min(8, Math.max(1, Math.round(par))) : 2;
  const dirty = (tip.trim() || null) !== (hole.tip ?? null) || nextPar !== hole.par;

  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl">{hole.hole}</p>
          <label className="mt-1 flex items-center gap-2 text-sm text-ink/50">
            par
            <input
              type="number"
              min={1}
              max={8}
              value={par}
              disabled={busy}
              onChange={(event) => setPar(Number(event.target.value))}
              className="w-14 rounded-lg border border-ink/15 px-2 py-1 text-sm text-ink"
            />
          </label>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hole.closed}
            disabled={busy}
            onChange={(event) => onToggleClosed(event.target.checked)}
          />
          v rekonstrukci
        </label>
      </div>

      {shownImage ? (
        <img
          src={shownImage}
          alt={`Plánek jamky ${hole.hole}`}
          className="mt-3 h-28 w-full rounded-xl object-cover bg-ink/5"
        />
      ) : (
        <div className="mt-3 flex h-28 items-center justify-center rounded-xl bg-ink/5 text-sm text-ink/40">
          Bez plánku
        </div>
      )}

      <label className="mt-3 block text-xs text-ink/50">
        Plánek (PNG nebo JPEG)
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setPickedName(file.name);
            setPreview(URL.createObjectURL(file));
            onUpload(file);
          }}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </label>
      {pickedName ? <p className="mt-1 text-xs text-ink/45">Nahrávám {pickedName}…</p> : null}

      <label className="mt-3 block text-xs text-ink/50">
        Tip, jak se hraje
        <input
          value={tip}
          onChange={(event) => setTip(event.target.value)}
          maxLength={160}
          placeholder="např. přes vodu zleva"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => onSave({ tip: tip.trim() || null, par: nextPar })}
          className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Uložit
        </button>
        {hole.imageUrl ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemoveImage}
            className="rounded-full px-4 py-2 text-sm text-ink/60 ring-1 ring-ink/15 hover:text-orange"
          >
            Odstranit plánek
          </button>
        ) : null}
      </div>
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

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-course"] });
    await queryClient.invalidateQueries({ queryKey: ["scorecard-stats"] });
  }

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
      await refresh();
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      if (!(error instanceof AdminAuthError)) {
        setMessage(error instanceof Error ? error.message : "Uložení se nepovedlo.");
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: { gameType: ScoreGameType; hole: number; file: File }) => {
      const image = await readFileAsDataUrl(input.file);
      return api.uploadAdminCourseImage({ gameType: input.gameType, hole: input.hole, image });
    },
    onSuccess: async () => {
      setMessage("Plánek je uložený na webu.");
      await refresh();
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      if (!(error instanceof AdminAuthError)) {
        setMessage(error instanceof Error ? error.message : "Nahrání se nepovedlo.");
      }
    },
  });

  const holes: CourseHole[] = courseQuery.data?.games[gameType] ?? [];
  const openCount = holes.filter((hole) => !hole.closed).length;
  const withPlan = holes.filter((hole) => hole.imageUrl).length;
  const busy = patchMutation.isPending || uploadMutation.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl">Jamky</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        U každé jamky můžeš změnit par (výchozí 2), nahrát plánek (PNG/JPEG) a tip. Soubor zůstane na
        webu pod <code className="text-xs">/uploads/holes/…</code>. Tlačítko Uložit mění jen par a tip —
        plánek se nenahrazuje.
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
            busy={busy}
            onToggleClosed={(closed) => patchMutation.mutate({ gameType, hole: hole.hole, closed })}
            onSave={({ tip, par }) => patchMutation.mutate({ gameType, hole: hole.hole, tip, par })}
            onUpload={(file) => uploadMutation.mutate({ gameType, hole: hole.hole, file })}
            onRemoveImage={() => patchMutation.mutate({ gameType, hole: hole.hole, imageUrl: null })}
          />
        ))}
      </div>
    </div>
  );
}
