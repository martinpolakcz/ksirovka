import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api, type GamePhoto, type ProfilePhoto } from "@/lib/api";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

function redirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    window.location.href = "/admin/login";
  }
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");

  const photosQuery = useQuery({
    queryKey: ["admin-game-photos"],
    queryFn: () => api.getAdminGamePhotos(),
  });
  const profilesQuery = useQuery({
    queryKey: ["admin-profile-photos"],
    queryFn: () => api.getAdminProfilePhotos(),
  });

  const sendPhoto = useMutation({
    mutationFn: api.sendGamePhotoToTv,
    onSuccess: () => {
      setNotice("Fotka ze hry je na TV v galerii.");
      void queryClient.invalidateQueries({ queryKey: ["admin-game-photos"] });
    },
    onError: (error) => {
      redirectIfUnauthorized(error);
      setNotice(error instanceof Error ? error.message : "Fotku se nepodařilo dát na TV.");
    },
  });

  if (photosQuery.error) redirectIfUnauthorized(photosQuery.error);
  if (profilesQuery.error) redirectIfUnauthorized(profilesQuery.error);

  const gameItems = photosQuery.data?.items ?? [];
  const profileItems = profilesQuery.data?.items ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl">Galerie</h1>
        <p className="mt-2 max-w-2xl text-ink/50">
          Všechno, co se nahrálo z appky: fotky ze hry (parta, jamka) a selfie do výsledků. Stažení nemaže soubor.
        </p>
        {notice ? <p className="mt-3 text-sm text-teal">{notice}</p> : null}
      </header>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">Ze hry</p>
        <h2 className="mt-1 font-display text-3xl">Parta a jamka</h2>
        {photosQuery.isLoading ? (
          <p className="mt-4 text-sm text-ink/50">Tahám fotky ze hry…</p>
        ) : gameItems.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">Zatím žádná fotka ze hry.</p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gameItems.map((item) => (
              <GameCard
                key={item.roundId}
                item={item}
                sending={sendPhoto.isPending && sendPhoto.variables === item.roundId}
                onSend={() => sendPhoto.mutate(item.roundId)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">Profily</p>
        <h2 className="mt-1 font-display text-3xl">Selfie do výsledků</h2>
        {profilesQuery.isLoading ? (
          <p className="mt-4 text-sm text-ink/50">Tahám profilové fotky…</p>
        ) : profileItems.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">Zatím žádná profilová fotka.</p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profileItems.map((item) => (
              <ProfileCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GameCard({
  item,
  sending,
  onSend,
}: {
  item: GamePhoto;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-[1.4rem] bg-mist">
      <img src={item.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
      <div className="p-3">
        <p className="truncate text-sm font-semibold">
          {item.winnerName || "Kolo"} · {GAME_LABELS[item.gameType] ?? item.gameType}
          {item.hidden ? <span className="ml-2 text-xs font-normal text-orange">skryté kolo</span> : null}
        </p>
        <p className="text-xs text-ink/45">{formatWhen(item.completedAt)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={item.downloadUrl}
            className="rounded-full px-3 py-1.5 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
          >
            Stáhnout
          </a>
          <button
            type="button"
            disabled={item.onTv || sending}
            onClick={onSend}
            className="rounded-full px-3 py-1.5 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white disabled:opacity-50"
          >
            {item.onTv ? "Už na TV" : sending ? "Dávám…" : "Dát na TV"}
          </button>
        </div>
      </div>
    </li>
  );
}

function ProfileCard({ item }: { item: ProfilePhoto }) {
  return (
    <li className="overflow-hidden rounded-[1.4rem] bg-mist">
      <img src={item.imageUrl} alt="" className="aspect-square w-full object-cover" />
      <div className="p-3">
        <p className="truncate text-sm font-semibold">{item.nickname}</p>
        <p className="truncate text-xs text-ink/45">{item.name}</p>
        <p className="text-xs text-ink/45">{formatWhen(item.updatedAt)}</p>
        <a
          href={item.downloadUrl}
          className="mt-2 inline-block rounded-full px-3 py-1.5 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
        >
          Stáhnout
        </a>
      </div>
    </li>
  );
}
