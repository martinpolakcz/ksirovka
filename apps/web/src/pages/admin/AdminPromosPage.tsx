import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAuthError, api, type PromoPayload, type TvPromo, type TvPromoCategory, type TvPromoSlot } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY_FORM: PromoPayload = {
  slot: "ticker",
  category: "golf",
  title: "",
  message: "",
  href: "",
  imageUrl: "",
  active: true,
  sortOrder: 0,
};

export function AdminPromosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PromoPayload>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const promosQuery = useQuery({
    queryKey: ["admin-promos"],
    queryFn: () => api.getAdminPromos(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: PromoPayload = {
        ...form,
        href: form.href || null,
        imageUrl: form.imageUrl || null,
      };
      if (editingId) {
        return api.updateAdminPromo(editingId, payload);
      }
      return api.createAdminPromo(payload);
    },
    onSuccess: async () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    },
    onError: (err) => {
      if (err instanceof AdminAuthError) {
        window.location.href = "/admin/login";
        return;
      }
      setError(err instanceof Error ? err.message : "Uložení se nepovedlo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAdminPromo(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });

  function edit(promo: TvPromo) {
    setEditingId(promo.id);
    setForm({
      slot: promo.slot,
      category: promo.category,
      title: promo.title,
      message: promo.message,
      href: promo.href ?? "",
      imageUrl: promo.imageUrl ?? "",
      active: promo.active ?? true,
      sortOrder: promo.sortOrder,
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  const items = promosQuery.data?.items ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h1 className="font-display text-4xl">Reklamy</h1>
        <p className="mt-2 text-ink/50">Ticker dole na TV a větší featured slot vpravo.</p>

        <TickerSpeedCard />

        <ul className="mt-6 space-y-3">
          {items.map((promo) => (
            <li
              key={promo.id}
              className="flex flex-col gap-3 rounded-3xl bg-mist p-4 md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-teal">
                  {promo.slot} · {promo.category}
                  {!promo.active && " · vypnuto"}
                </p>
                <p className="truncate font-medium">{promo.title}</p>
                <p className="truncate text-sm text-ink/50">{promo.message}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => edit(promo)}>
                  Upravit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(promo.id)}
                >
                  Smazat
                </Button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-ink/50">Zatím žádné reklamy.</li>}
        </ul>
      </section>

      <form onSubmit={onSubmit} className="rounded-[2rem] bg-mist p-6">
        <h2 className="font-display text-3xl">{editingId ? "Upravit reklamu" : "Nová reklama"}</h2>

        <label className="mt-5 block text-sm text-ink/70">
          Slot
          <select
            value={form.slot}
            onChange={(event) => setForm((current) => ({ ...current, slot: event.target.value as TvPromoSlot }))}
            className="mt-2 h-11 w-full rounded-full bg-white px-4 text-ink ring-1 ring-ink/10"
          >
            <option value="ticker">Běžící lišta</option>
            <option value="featured">Velký slot</option>
            <option value="gallery">Galerie ze hry</option>
          </select>
        </label>

        <label className="mt-4 block text-sm text-ink/70">
          Kategorie
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value as TvPromoCategory }))
            }
            className="mt-2 h-11 w-full rounded-full bg-white px-4 text-ink ring-1 ring-ink/10"
          >
            <option value="golf">Golf</option>
            <option value="hopsalkov">Hopsálkov</option>
            <option value="venue">Kšírovka</option>
          </select>
        </label>

        <Field
          label="Titulek"
          value={form.title}
          required
          onChange={(title) => setForm((current) => ({ ...current, title }))}
        />
        <label className="mt-4 block text-sm text-ink/70">
          Text
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className="mt-2 min-h-24 w-full rounded-3xl bg-white px-4 py-3 text-ink ring-1 ring-ink/10"
            required
          />
        </label>
        <Field label="Odkaz" value={form.href ?? ""} onChange={(href) => setForm((current) => ({ ...current, href }))} />
        <Field
          label="Obrázek URL"
          value={form.imageUrl ?? ""}
          onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))}
        />
        <Field
          label="Pořadí"
          type="number"
          value={String(form.sortOrder)}
          onChange={(sortOrder) =>
            setForm((current) => ({ ...current, sortOrder: Number(sortOrder) || 0 }))
          }
        />

        <label className="mt-4 flex items-center gap-3 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            className="size-4 accent-teal"
          />
          Zapnuto
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            {editingId ? "Uložit" : "Přidat"}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Zrušit
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function TickerSpeedCard() {
  const queryClient = useQueryClient();
  const [seconds, setSeconds] = useState(36);
  const [message, setMessage] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["admin-tv-data"],
    queryFn: () => api.getAdminTvData(),
  });

  useEffect(() => {
    const value = settingsQuery.data?.settings.tickerSeconds;
    if (typeof value === "number") setSeconds(value);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => api.saveAdminTvData({ tickerSeconds: seconds }),
    onSuccess: async () => {
      setMessage("Rychlost lišty je uložená. Na TV se projeví do 10 sekund.");
      await queryClient.invalidateQueries({ queryKey: ["admin-tv-data"] });
    },
    onError: (err) => {
      if (err instanceof AdminAuthError) {
        window.location.href = "/admin/login";
        return;
      }
      setMessage(err instanceof Error ? err.message : "Uložení se nepovedlo");
    },
  });

  return (
    <div className="mt-6 rounded-3xl bg-mist p-5">
      <p className="text-xs uppercase tracking-wider text-teal">Běžící lišta</p>
      <h2 className="mt-1 font-display text-2xl">Rychlost běhu</h2>
      <p className="mt-2 text-sm text-ink/50">
        Kolik sekund trvá jedno projetí textu na TV. Čím menší číslo, tím rychleji lišta běží.
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-wider text-ink/40">
        <span>Rychleji</span>
        <input
          type="range"
          min={8}
          max={120}
          step={1}
          value={seconds}
          onChange={(event) => {
            setSeconds(Number(event.target.value));
            setMessage("");
          }}
          className="h-2 w-full accent-teal"
          aria-label="Rychlost běžící lišty"
        />
        <span>Pomaleji</span>
      </div>
      <p className="mt-3 text-sm text-ink/70">
        {seconds} {seconds === 1 ? "sekunda" : seconds >= 2 && seconds <= 4 ? "sekundy" : "sekund"} na jedno projetí
      </p>
      {message && <p className="mt-2 text-sm text-ink/50">{message}</p>}
      <Button
        type="button"
        className="mt-4"
        disabled={saveMutation.isPending || settingsQuery.isLoading}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? "Ukládám…" : "Uložit rychlost"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("mt-4 block text-sm text-ink/70")}>
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-full bg-white px-4 text-ink ring-1 ring-ink/10"
      />
    </label>
  );
}
