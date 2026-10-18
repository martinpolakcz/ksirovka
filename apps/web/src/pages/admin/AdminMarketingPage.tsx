import { useMemo, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminAuthError,
  api,
  type AdminNotice,
  type MarketingCampaign,
  type MarketingPlayer,
  type MarketingSnapshot,
  type NoticeKind,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { GAME_LABELS } from "@/pages/tv/tv-shared";

const NOTICE_KINDS: Array<{ id: NoticeKind; label: string }> = [
  { id: "news", label: "Novinka" },
  { id: "hot", label: "Horká událost" },
  { id: "happened", label: "Stalo se" },
];

const LOCALE_LABELS: Record<string, string> = {
  cs: "Čeština",
  sk: "Slovenčina",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  vi: "Tiếng Việt",
};

function redirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    window.location.href = "/admin/login";
  }
}

function formatVsPar(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "E";
  const abs = Math.abs(value);
  const pretty = Number.isInteger(abs) ? String(abs) : abs.toFixed(1).replace(".", ",");
  return value > 0 ? `+${pretty}` : `−${pretty}`;
}

function platformLabel(platform: string | null): string {
  if (platform === "ios") return "iPhone";
  if (platform === "android") return "Android";
  if (platform === "other") return "Jiné";
  return "—";
}

function localeLabel(locale: string | null): string {
  if (!locale) return "—";
  return LOCALE_LABELS[locale] ?? locale;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "ještě nehrál";
  return new Date(iso).toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
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

function noticeKindLabel(kind: NoticeKind): string {
  return NOTICE_KINDS.find((item) => item.id === kind)?.label ?? kind;
}

function roundsWord(count: number): string {
  if (count === 1) return "1 kolo";
  if (count >= 2 && count <= 4) return `${count} kola`;
  return `${count} kol`;
}

const CAMPAIGN_GAMES = ["fotbalgolf", "minigolf", "adventure"] as const;

function parseCrossCampaign(id: string): { played: (typeof CAMPAIGN_GAMES)[number]; missing: (typeof CAMPAIGN_GAMES)[number] } | null {
  if (!id.startsWith("cross-")) return null;
  const rest = id.slice("cross-".length);
  const played = CAMPAIGN_GAMES.find((game) => rest.startsWith(`${game}-`));
  if (!played) return null;
  const missing = rest.slice(played.length + 1);
  if (!CAMPAIGN_GAMES.includes(missing as (typeof CAMPAIGN_GAMES)[number])) return null;
  return { played, missing: missing as (typeof CAMPAIGN_GAMES)[number] };
}

function campaignPlayerHint(campaignId: string, player: MarketingPlayer): string {
  const bits: string[] = [];
  const cross = parseCrossCampaign(campaignId);
  if (campaignId === "new") {
    bits.push(`Poprvé ${formatDate(player.firstPlayedAt)}`);
  } else if (campaignId === "comeback" && player.daysSinceLast != null) {
    bits.push(`${player.daysSinceLast} dní pryč`);
  } else if (campaignId === "regulars") {
    bits.push("Chodí pravidelně");
  } else if (campaignId === "no-email") {
    bits.push("Známý jen z kola");
  } else if (cross) {
    bits.push(`Hraje ${GAME_LABELS[cross.played]} · chybí ${GAME_LABELS[cross.missing]}`);
  }
  bits.push(roundsWord(player.rounds));
  bits.push(`vs par ${formatVsPar(player.avgVsPar)}`);
  if (campaignId !== "comeback") {
    bits.push(player.lastPlayedAt ? `naposledy ${formatDate(player.lastPlayedAt)}` : "bez data");
  }
  if (player.favoriteGame && !cross) {
    bits.push(GAME_LABELS[player.favoriteGame]);
  }
  return bits.join(" · ");
}

const WEEKDAY_WHEN = ["v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu", "v neděli"] as const;

type SlotFilter = { dow?: number; hour?: number };
type SlotStat = { rounds: number; lastDate: string; games: string[] };
type PeopleRosterView = {
  kicker: string;
  title: string;
  pitch: string;
  extra?: string;
  people: MarketingPlayer[];
  hint: (player: MarketingPlayer) => string;
  subject?: string;
};

function isoDowFromDateKey(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function collectSlot(data: MarketingSnapshot, filter: SlotFilter): { people: MarketingPlayer[]; stats: Map<string, SlotStat>; rounds: number } {
  const stats = new Map<string, SlotStat>();
  let rounds = 0;
  for (const log of Object.values(data.days)) {
    const dow = isoDowFromDateKey(log.date);
    if (filter.dow != null && dow !== filter.dow) continue;
    for (const round of log.rounds) {
      if (filter.hour != null && round.hour !== filter.hour) continue;
      rounds += 1;
      for (const seat of round.players) {
        const current = stats.get(seat.name) ?? { rounds: 0, lastDate: log.date, games: [] };
        current.rounds += 1;
        if (log.date > current.lastDate) current.lastDate = log.date;
        if (!current.games.includes(round.label)) current.games.push(round.label);
        stats.set(seat.name, current);
      }
    }
  }
  const people = data.players
    .filter((player) => stats.has(player.nickname))
    .sort((a, b) => (stats.get(b.nickname)?.rounds ?? 0) - (stats.get(a.nickname)?.rounds ?? 0));
  return { people, stats, rounds };
}

function slotTitle(data: MarketingSnapshot, filter: SlotFilter): string {
  const day = filter.dow != null ? data.weekdays.find((item) => item.dow === filter.dow)?.label : null;
  const hour = filter.hour != null ? `${String(filter.hour).padStart(2, "0")}:00` : null;
  if (day && hour) return `${day} ${hour}`;
  if (day) return day;
  if (hour) return hour;
  return "Termín";
}

function slotPitch(filter: SlotFilter, rounds: number, people: number): string {
  const when =
    filter.dow != null && filter.hour != null
      ? `${WEEKDAY_WHEN[filter.dow - 1]} v ${String(filter.hour).padStart(2, "0")}:00`
      : filter.dow != null
        ? WEEKDAY_WHEN[filter.dow - 1]
        : filter.hour != null
          ? `v ${String(filter.hour).padStart(2, "0")}:00`
          : "";
  return `${roundsWord(rounds)} ${when}. ${people} ${people === 1 ? "hráč" : people < 5 ? "hráči" : "hráčů"} v tomhle okně.`;
}

function rosterFromSlot(data: MarketingSnapshot, filter: SlotFilter): PeopleRosterView {
  const slot = collectSlot(data, filter);
  return {
    kicker: "Kdo tu hraje",
    title: slotTitle(data, filter),
    pitch: slotPitch(filter, slot.rounds, slot.people.length),
    extra: [...new Set(slot.people.flatMap((player) => player.gamesPlayed))].map((game) => GAME_LABELS[game]).join(" · "),
    people: slot.people,
    hint: (player) => {
      const stat = slot.stats.get(player.nickname);
      if (!stat) return campaignPlayerHint("slot", player);
      return `${roundsWord(stat.rounds)} tady · naposledy ${formatDate(`${stat.lastDate}T12:00:00`)} · ${stat.games.join(", ")}`;
    },
  };
}

function rosterFromCampaign(data: MarketingSnapshot, campaign: MarketingCampaign): PeopleRosterView {
  const names = new Set(campaign.nicknames);
  return {
    kicker: "Skupina k oslovení",
    title: campaign.title,
    pitch: campaign.pitch,
    extra: campaign.subject ? `předmět: ${campaign.subject}` : undefined,
    people: sortCampaignPeople(
      campaign.id,
      data.players.filter((player) => names.has(player.nickname)),
    ),
    hint: (player) => campaignPlayerHint(campaign.id, player),
    subject: campaign.subject || undefined,
  };
}

function sortCampaignPeople(campaignId: string, people: MarketingPlayer[]): MarketingPlayer[] {
  const copy = [...people];
  if (campaignId === "new") {
    return copy.sort((a, b) => (b.firstPlayedAt ?? "").localeCompare(a.firstPlayedAt ?? ""));
  }
  if (campaignId === "comeback") {
    return copy.sort((a, b) => (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0));
  }
  return copy.sort((a, b) => (b.lastPlayedAt ?? "").localeCompare(a.lastPlayedAt ?? ""));
}

function heatTone(value: number, max: number): string {
  if (value <= 0 || max <= 0) return "bg-mist text-ink/30";
  const ratio = value / max;
  if (ratio > 0.72) return "bg-teal text-white";
  if (ratio > 0.4) return "bg-teal/70 text-white";
  if (ratio > 0.18) return "bg-forest-200 text-forest-900";
  return "bg-forest-100 text-forest-800";
}

function BarList({
  items,
  onSelect,
}: {
  items: Array<{ key: string; label: string; value: number; hint?: string }>;
  onSelect?: (key: string) => void;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const inner = (
          <>
            <span className="text-sm font-semibold tracking-wide text-ink/70">{item.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal to-orange"
                style={{ width: `${Math.max(item.value > 0 ? 8 : 0, (item.value / max) * 100)}%` }}
              />
            </div>
            <span className="text-right font-display text-sm tabular-nums">
              {item.value}
              {item.hint ? <span className="block text-[10px] font-sans text-ink/40">{item.hint}</span> : null}
            </span>
          </>
        );
        const clickable = Boolean(onSelect) && item.value > 0;
        return (
          <li key={item.key}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect?.(item.key)}
                className="grid w-full grid-cols-[4.5rem_minmax(0,1fr)_2.4rem] items-center gap-3 rounded-xl px-1 py-0.5 text-left hover:bg-mist"
              >
                {inner}
              </button>
            ) : (
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.4rem] items-center gap-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Panel({
  kicker,
  title,
  children,
  className,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-[0_12px_40px_rgba(13,61,60,0.08)] ring-1 ring-ink/10", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange">{kicker}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function uniqueEmails(players: MarketingSnapshot["players"]): string[] {
  return [...new Set(players.map((player) => player.email).filter((email): email is string => Boolean(email)))];
}

function downloadCsv(players: MarketingSnapshot["players"]) {
  const header = [
    "prezdivka",
    "jmeno",
    "email",
    "vek",
    "zarizeni",
    "jazyk",
    "novinky",
    "kola",
    "vs_par",
    "oblibena_hra",
    "naposledy",
    "hry",
  ];
  const rows = players.map((player) =>
    [
      player.nickname,
      player.name ?? "",
      player.email ?? "",
      player.age ?? "",
      platformLabel(player.platform),
      localeLabel(player.locale),
      player.noticesOptIn ? "ano" : "ne",
      player.rounds,
      player.avgVsPar ?? "",
      player.favoriteGame ? GAME_LABELS[player.favoriteGame] : "",
      player.lastPlayedAt ?? "",
      player.gamesPlayed.map((game) => GAME_LABELS[game]).join(" "),
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob(["\uFEFF" + [header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ksirovka-hraci-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminMarketingPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [campaignId, setCampaignId] = useState<string>("all");
  const [notice, setNotice] = useState("");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [openNickname, setOpenNickname] = useState<string | null>(null);
  const [roster, setRoster] = useState<PeopleRosterView | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("news");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const marketingQuery = useQuery({
    queryKey: ["admin-marketing"],
    queryFn: () => api.getAdminMarketing(),
  });
  const noticesQuery = useQuery({
    queryKey: ["admin-notices"],
    queryFn: () => api.getAdminNotices(),
  });
  const sendNotice = useMutation({
    mutationFn: api.sendAdminNotice,
    onSuccess: (result) => {
      setNotice(`Do appky šlo ${result.sent} zpráv${result.skipped ? `, ${result.skipped} bez souhlasu přeskočeno` : ""}.`);
      setNoticeTitle("");
      setNoticeMessage("");
      void queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Kampaň se neodeslala."),
  });
  if (marketingQuery.error) {
    redirectIfUnauthorized(marketingQuery.error);
  }
  if (noticesQuery.error) {
    redirectIfUnauthorized(noticesQuery.error);
  }

  const data = marketingQuery.data;
  const selectedCampaign = data?.campaigns.find((item) => item.id === campaignId) ?? null;
  const players = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("cs");
    const names = selectedCampaign ? new Set(selectedCampaign.nicknames) : null;
    return (data?.players ?? []).filter((player) => {
      if (names && !names.has(player.nickname)) return false;
      if (!needle) return true;
      return [player.nickname, player.name, player.email, player.platform, player.locale, player.age]
        .filter((value) => value != null && value !== "")
        .join(" ")
        .toLocaleLowerCase("cs")
        .includes(needle);
    });
  }, [data?.players, query, selectedCampaign]);

  const openPlayer = (data?.players ?? []).find((player) => player.nickname === openNickname) ?? null;
  const minAge = ageFrom.trim() ? Number(ageFrom) : null;
  const maxAge = ageTo.trim() ? Number(ageTo) : null;
  const pickedPlayers = useMemo(() => {
    const names = picked;
    return (data?.players ?? []).filter((player) => {
      if (!names.has(player.nickname)) return false;
      if (minAge != null && Number.isFinite(minAge) && (player.age == null || player.age < minAge)) return false;
      if (maxAge != null && Number.isFinite(maxAge) && (player.age == null || player.age > maxAge)) return false;
      return true;
    });
  }, [data?.players, picked, minAge, maxAge]);
  const inboxTargets = pickedPlayers.filter((player) => player.email && player.noticesOptIn);

  function togglePicked(nickname: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(nickname)) next.delete(nickname);
      else next.add(nickname);
      return next;
    });
  }

  if (marketingQuery.isLoading || !data) {
    return <p className="text-ink/50">Sčítám startovní listinu…</p>;
  }

  const emails = uniqueEmails(players);

  async function copyEmails() {
    if (emails.length === 0) {
      setNotice("V tomhle výběru není žádný e-mail.");
      return;
    }
    await navigator.clipboard.writeText(emails.join(", "));
    setNotice(`Zkopírováno ${emails.length} e-mailů.`);
  }

  function openMail() {
    if (emails.length === 0) {
      setNotice("V tomhle výběru není žádný e-mail.");
      return;
    }
    const subject = selectedCampaign?.subject || "Zahraj si na Kšírovce";
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(subject)}`;
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2rem] bg-forest-950 px-6 py-8 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-orange/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-teal/40 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange">Starter notebook</p>
        <h1 className="mt-2 max-w-xl font-display text-4xl font-semibold tracking-tight">Marketing a strategie</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
          Koho pozvat znovu, komu nabídnout druhou hru a kdy to poslat. Časy jsou v Europe/Prague.
          E-maily bereme z profilu ve scorecard — posílej jen lidem, kteří o novinky stojí.
        </p>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatChip label="Kol" value={String(data.summary.rounds)} hint="viditelná kola" />
          <StatChip
            label="Oslovitelní"
            value={String(data.summary.contactable)}
            hint={`${data.summary.inboxable} novinky v appce`}
          />
          <StatChip
            label="Ztrácejí se"
            value={String(data.summary.lapsed)}
            hint="14+ dní, mají e-mail"
          />
          <StatChip
            label="Nejsilnější slot"
            value={data.summary.peakHour?.label ?? "—"}
            hint={data.summary.peakWeekday ? `${data.summary.peakWeekday.label} · ${data.summary.favoriteGame?.label ?? ""}` : "zatím bez dat"}
          />
        </dl>
      </header>

      <Panel kicker="Startovní listina kampaní" title="Koho oslovit">
        <p className="mb-5 text-sm text-ink/55">
          Klikni na skupinu — uvidíš kdo to je, co hraje a kdy tu byl naposledy. Z pop-upu jde rovnou do karty hráče
          nebo do výběru kampaně.
        </p>
        {data.campaigns.length === 0 ? (
          <p className="text-sm text-ink/50">Až přijdou kola s e-mailem, tady naskočí konkrétní skupiny k oslovení.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.campaigns.map((item) => (
              <CampaignTicket
                key={item.id}
                campaign={item}
                active={campaignId === item.id}
                onSelect={() => {
                  setCampaignId(item.id);
                  setRoster(rosterFromCampaign(data, item));
                }}
              />
            ))}
          </div>
        )}
        {(data.languages.length > 0 || data.platforms.length > 0) && (
          <div className="mt-6 grid gap-6 border-t border-ink/10 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">Jazyky v appce</p>
              <BarList
                items={data.languages.map((item) => ({
                  key: item.id,
                  label: item.label,
                  value: item.players,
                }))}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">Telefony</p>
              <BarList
                items={data.platforms.map((item) => ({
                  key: item.id,
                  label: item.label,
                  value: item.players,
                }))}
              />
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel kicker="01 · Tee sheet" title="Kdy chodí hrát">
          <p className="mb-4 text-sm text-ink/55">Klikni na den — uvidíš kdo v ten den chodí.</p>
          <BarList
            items={data.weekdays.map((day) => ({
              key: String(day.dow),
              label: day.label,
              value: day.rounds,
              hint: day.players ? `${day.players} hráčů` : undefined,
            }))}
            onSelect={(key) => setRoster(rosterFromSlot(data, { dow: Number(key) }))}
          />
        </Panel>
        <Panel kicker="02 · Odpal" title="V kterou hodinu">
          <p className="mb-4 text-sm text-ink/55">Klikni na hodinu — uvidíš kdo v ten čas startuje.</p>
          <BarList
            items={data.hours.map((hour) => ({
              key: String(hour.hour),
              label: hour.label,
              value: hour.rounds,
            }))}
            onSelect={(key) => setRoster(rosterFromSlot(data, { hour: Number(key) }))}
          />
        </Panel>
      </div>

      <Panel kicker="03 · Mřížka" title="Den × hodina">
        <p className="mb-4 text-sm text-ink/55">Klikni na políčko — konkrétní den a hodina, konkrétní lidi.</p>
        <HourGrid data={data} onSelect={(dow, hour) => setRoster(rosterFromSlot(data, { dow, hour }))} />
      </Panel>

      <Panel kicker="04 · Kalendář hřiště" title="Kdy se objevili na jamkách">
        <p className="mb-5 text-sm text-ink/55">Klikni na den — uvidíš kdo hrál, kterou hru a jak to dopadlo.</p>
        <div className="grid gap-8 xl:grid-cols-3">
          {data.months.map((month) => (
            <MonthCard
              key={`${month.year}-${month.month}`}
              month={month}
              selected={openDate}
              onSelect={setOpenDate}
            />
          ))}
        </div>
        <DayDialog
          date={openDate}
          days={data.days}
          onChange={setOpenDate}
          onSelectPlayer={setOpenNickname}
        />
      </Panel>

      <CampaignComposer
        kind={noticeKind}
        title={noticeTitle}
        message={noticeMessage}
        players={data.players}
        pickedNames={picked}
        picked={pickedPlayers.length}
        inboxable={inboxTargets.length}
        ageFrom={ageFrom}
        ageTo={ageTo}
        sending={sendNotice.isPending}
        history={noticesQuery.data?.items ?? []}
        historyLoading={noticesQuery.isLoading}
        onKind={setNoticeKind}
        onTitle={setNoticeTitle}
        onMessage={setNoticeMessage}
        onAgeFrom={setAgeFrom}
        onAgeTo={setAgeTo}
        onToggle={togglePicked}
        onSelectAll={(nicknames) => setPicked(new Set(nicknames))}
        onClear={() => setPicked(new Set())}
        onReuse={(item) => {
          setNoticeKind(item.kind);
          setNoticeTitle(item.title);
          setNoticeMessage(item.message);
          setPicked(new Set(item.recipients.map((person) => person.nickname)));
          setNotice(`Z kampaně „${item.title}“ je ve výběru ${item.recipients.length} lidí. Uprav a pošli znovu.`);
        }}
        onSend={() => {
          if (!noticeTitle.trim() || !noticeMessage.trim()) {
            setNotice("Doplň titulek i text kampaně.");
            return;
          }
          if (inboxTargets.length === 0) {
            setNotice("V tomhle výběru nikdo nemá souhlas s novinkami v appce.");
            return;
          }
          sendNotice.mutate({
            kind: noticeKind,
            title: noticeTitle.trim(),
            message: noticeMessage.trim(),
            nicknames: inboxTargets.map((player) => player.nickname),
          });
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel kicker="05 · Mix her" title="Co hrají">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-[11px] uppercase tracking-[0.16em] text-ink/45">
                  <th className="pb-2 font-medium">Hra</th>
                  <th className="pb-2 font-medium">Kol</th>
                  <th className="pb-2 font-medium">Hráčů</th>
                  <th className="pb-2 font-medium">Průměr vs par</th>
                  <th className="pb-2 font-medium">Nejlepší</th>
                </tr>
              </thead>
              <tbody>
                {data.games.map((game) => (
                  <tr key={game.gameType} className="border-b border-ink/5">
                    <td className="py-3 font-semibold">{game.label}</td>
                    <td className="py-3 tabular-nums">{game.rounds}</td>
                    <td className="py-3 tabular-nums">{game.players}</td>
                    <td className="py-3 font-display text-lg tabular-nums">{formatVsPar(game.avgVsPar)}</td>
                    <td className="py-3 text-ink/70">
                      {game.bestPlayer ? `${game.bestPlayer} ${formatVsPar(game.bestVsPar)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel kicker="06 · Par" title="Jak končí proti paru">
          <p className="mb-4 text-sm text-ink/55">
            Průměr všech výsledků:{" "}
            <span className="font-display text-2xl text-ink">{formatVsPar(data.vsPar.avg)}</span>
          </p>
          <BarList
            items={data.vsPar.buckets.map((bucket) => ({
              key: bucket.id,
              label: bucket.label,
              value: bucket.count,
            }))}
          />
        </Panel>
      </div>

      <Panel kicker="07 · Roster" title="Hráči, e-maily, zařízení a jazyk">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-xl text-sm text-ink/55">
            {selectedCampaign
              ? `${selectedCampaign.title}: ${players.length} lidí, ${emails.length} e-mailů.`
              : "Klikni na přezdívku — uvidíš historii. Zaškrtni řádky do kampaně v appce."}
            {selectedCampaign ? (
              <button
                type="button"
                className="ml-2 text-teal hover:underline"
                onClick={() => setCampaignId("all")}
              >
                Zrušit filtr
              </button>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyEmails()}
              className="rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
            >
              Kopírovat e-maily
            </button>
            <button
              type="button"
              onClick={openMail}
              className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
            >
              Otevřít e-mail
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(players)}
              className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => setPicked(new Set(players.map((player) => player.nickname)))}
              className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
            >
              Vybrat zobrazené
            </button>
            <label className="block">
              <span className="sr-only">Hledat hráče</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Hledat jméno, e-mail, zařízení…"
                className="w-64 rounded-full border border-ink/15 bg-mist px-4 py-2 text-sm outline-none ring-orange/0 focus:ring-2 focus:ring-orange"
              />
            </label>
          </div>
        </div>
        {notice ? <p className="mb-3 text-sm text-teal">{notice}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-[0.16em] text-ink/45">
                <th className="w-10 pb-2 font-medium" />
                <th className="pb-2 font-medium">Přezdívka</th>
                <th className="pb-2 font-medium">Jméno</th>
                <th className="pb-2 font-medium">E-mail</th>
                <th className="pb-2 font-medium">Věk</th>
                <th className="pb-2 font-medium">Zařízení</th>
                <th className="pb-2 font-medium">Jazyk</th>
                <th className="pb-2 font-medium">Kol</th>
                <th className="pb-2 font-medium">Vs par</th>
                <th className="pb-2 font-medium">Oblíbená hra</th>
                <th className="pb-2 font-medium">Dní pryč</th>
                <th className="pb-2 font-medium">Naposledy</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                    <td colSpan={11} className="py-8 text-center text-ink/40">
                    Nikdo zatím nesedí na téhle listině.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={`${player.nickname}-${player.email ?? ""}`} className="border-b border-ink/5">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={picked.has(player.nickname)}
                        onChange={() => togglePicked(player.nickname)}
                        aria-label={`Vybrat ${player.nickname}`}
                      />
                    </td>
                    <td className="py-3 font-semibold">
                      <button
                        type="button"
                        className="text-left text-teal hover:underline"
                        onClick={() => setOpenNickname(player.nickname)}
                      >
                        {player.nickname}
                      </button>
                    </td>
                    <td className="py-3 text-ink/80">{player.name ?? "—"}</td>
                    <td className="py-3">
                      {player.email ? (
                        <a className="text-teal hover:underline" href={`mailto:${player.email}`}>
                          {player.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 tabular-nums">{player.age ?? "—"}</td>
                    <td className="py-3">{platformLabel(player.platform)}</td>
                    <td className="py-3">{localeLabel(player.locale)}</td>
                    <td className="py-3 tabular-nums">{player.rounds}</td>
                    <td className="py-3 font-display tabular-nums">{formatVsPar(player.avgVsPar)}</td>
                    <td className="py-3">{player.favoriteGame ? GAME_LABELS[player.favoriteGame] : "—"}</td>
                    <td className="py-3 tabular-nums text-ink/70">
                      {player.daysSinceLast == null ? "—" : player.daysSinceLast}
                    </td>
                    <td className="py-3 text-ink/60">{formatWhen(player.lastPlayedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <PeopleRosterDialog
        roster={roster}
        picked={picked}
        onClose={() => setRoster(null)}
        onSelectPlayer={setOpenNickname}
        onToggle={togglePicked}
        onTakeAll={(nicknames) => {
          setPicked(new Set(nicknames));
          if (roster?.subject) setNoticeTitle(roster.subject);
          setNotice(`Ve výběru je ${nicknames.length} lidí ze skupiny ${roster?.title ?? "kampaně"}.`);
        }}
      />
      <PlayerDialog
        player={openPlayer}
        onClose={() => setOpenNickname(null)}
        picked={openPlayer ? picked.has(openPlayer.nickname) : false}
        onPick={(nickname) => togglePicked(nickname)}
      />
    </div>
  );
}

function CampaignTicket({
  campaign,
  active,
  onSelect,
}: {
  campaign: MarketingCampaign;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-[1.4rem] border-l-4 p-4 text-left transition",
        active ? "border-orange bg-orange/10 ring-1 ring-orange/40" : "border-teal bg-mist/60 hover:bg-white",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xl font-semibold tracking-tight">{campaign.title}</p>
        <p className="text-sm tabular-nums text-ink/50">
          {campaign.emails} e-mailů · {campaign.players} lidí
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/65">{campaign.pitch}</p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">Kdo to je</p>
    </button>
  );
}

function PeopleRosterDialog({
  roster,
  picked,
  onClose,
  onSelectPlayer,
  onToggle,
  onTakeAll,
}: {
  roster: PeopleRosterView | null;
  picked: Set<string>;
  onClose: () => void;
  onSelectPlayer: (nickname: string) => void;
  onToggle: (nickname: string) => void;
  onTakeAll: (nicknames: string[]) => void;
}) {
  const people = roster?.people ?? [];
  const emails = uniqueEmails(people);
  const inboxable = people.filter((player) => player.email && player.noticesOptIn).length;
  const newest = people.reduce<string | null>((best, player) => {
    const at = player.lastPlayedAt;
    if (!at) return best;
    if (!best || at > best) return at;
    return best;
  }, null);

  return (
    <Dialog.Root open={Boolean(roster)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-[8vh] z-[70] mx-auto max-h-[84vh] max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(13,61,60,0.28)] outline-none sm:p-8">
          {roster ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange">{roster.kicker}</p>
                  <Dialog.Title className="mt-1 font-display text-3xl font-semibold tracking-tight">
                    {roster.title}
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-ink/65">{roster.pitch}</Dialog.Description>
                </div>
                <Dialog.Close className="rounded-full px-3 py-1.5 text-sm text-ink/50 hover:text-ink">Zavřít</Dialog.Close>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Lidi" value={String(people.length)} />
                <MiniStat label="E-maily" value={String(emails.length)} />
                <MiniStat label="Novinky v appce" value={String(inboxable)} />
                <MiniStat label="Poslední u nich" value={newest ? formatDate(newest) : "—"} />
              </dl>
              {roster.extra ? <p className="mt-4 text-sm text-ink/60">{roster.extra}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
                  onClick={() => onTakeAll(people.map((player) => player.nickname))}
                >
                  Vzít do výběru kampaně
                </button>
                {emails.length > 0 ? (
                  <button
                    type="button"
                    className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
                    onClick={() => void navigator.clipboard.writeText(emails.join(", "))}
                  >
                    Kopírovat e-maily
                  </button>
                ) : null}
              </div>

              {people.length === 0 ? (
                <p className="mt-6 text-sm text-ink/50">V tomhle okně teď nikdo není.</p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {people.map((player) => {
                    const canInbox = Boolean(player.email && player.noticesOptIn);
                    return (
                      <li key={player.nickname} className="flex items-start gap-3 rounded-2xl bg-mist p-3">
                        <input
                          type="checkbox"
                          className="mt-4"
                          checked={picked.has(player.nickname)}
                          onChange={() => onToggle(player.nickname)}
                          aria-label={`Vybrat ${player.nickname}`}
                        />
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt=""
                            className="mt-1 size-11 rounded-full object-cover ring-2 ring-teal/20"
                          />
                        ) : (
                          <div className="mt-1 flex size-11 items-center justify-center rounded-full bg-forest-100 font-display text-lg text-teal">
                            {player.nickname.slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => onSelectPlayer(player.nickname)}
                          >
                            <span className="font-semibold text-teal hover:underline">{player.nickname}</span>
                            {player.name && player.name !== player.nickname ? (
                              <span className="text-ink/55"> · {player.name}</span>
                            ) : null}
                            {player.age != null ? (
                              <span className="text-ink/45"> · {player.age} let</span>
                            ) : null}
                          </button>
                          <p className="mt-1 text-sm leading-5 text-ink/65">{roster.hint(player)}</p>
                          <p className="mt-1 truncate text-xs text-ink/50">
                            {player.email ? (
                              <a className="text-teal hover:underline" href={`mailto:${player.email}`}>
                                {player.email}
                              </a>
                            ) : (
                              "Bez e-mailu"
                            )}
                            {canInbox ? " · novinky bere" : " · kampaň do appky nedorazí"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StatChip({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-white/50">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-semibold">{value}</dd>
      <p className="mt-1 text-xs text-white/45">{hint}</p>
    </div>
  );
}

function HourGrid({
  data,
  onSelect,
}: {
  data: MarketingSnapshot;
  onSelect: (dow: number, hour: number) => void;
}) {
  const max = Math.max(1, ...data.hourHeatmap.map((cell) => cell.rounds));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-separate border-spacing-1 text-center text-[11px]">
        <thead>
          <tr>
            <th className="w-10 font-medium text-ink/40" />
            {data.hours.map((hour) => (
              <th key={hour.hour} className="font-medium text-ink/40">
                {hour.hour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.weekdays.map((day) => (
            <tr key={day.dow}>
              <th className="pr-2 text-left font-semibold text-ink/70">{day.label}</th>
              {data.hours.map((hour) => {
                const cell = data.hourHeatmap.find((item) => item.dow === day.dow && item.hour === hour.hour);
                const rounds = cell?.rounds ?? 0;
                const className = cn(
                  "flex h-8 w-full items-center justify-center rounded-md tabular-nums",
                  heatTone(rounds, max),
                  rounds > 0 && "cursor-pointer hover:ring-2 hover:ring-orange/70",
                );
                return (
                  <td key={`${day.dow}-${hour.hour}`}>
                    {rounds > 0 ? (
                      <button
                        type="button"
                        title={`${day.label} ${hour.label}: ${rounds} kol`}
                        aria-label={`${day.label} ${hour.label}: ${rounds} kol, kdo hrál`}
                        onClick={() => onSelect(day.dow, hour.hour)}
                        className={className}
                      >
                        {rounds}
                      </button>
                    ) : (
                      <div title={`${day.label} ${hour.label}: 0 kol`} className={className} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function formatDayTitle(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Prague",
  });
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("cs-CZ", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MonthCard({
  month,
  selected,
  onSelect,
}: {
  month: MarketingSnapshot["months"][number];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const max = Math.max(1, ...month.days.map((day) => day.rounds));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Prague" });
  return (
    <div>
      <p className="mb-3 font-display text-lg capitalize">{month.label}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-ink/40">
        {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {month.days.map((day) => {
          const dayNum = Number(day.date.slice(-2));
          const clickable = day.inMonth || day.rounds > 0;
          const className = cn(
            "flex aspect-square flex-col items-center justify-center rounded-xl text-sm tabular-nums",
            day.inMonth ? heatTone(day.rounds, max) : "bg-transparent text-ink/20",
            day.date === today && "ring-2 ring-orange",
            day.date === selected && "ring-2 ring-teal",
            clickable && "cursor-pointer hover:ring-2 hover:ring-orange/70",
          );
          if (!clickable) {
            return (
              <div key={day.date} className={className}>
                <span className="opacity-40">{dayNum}</span>
              </div>
            );
          }
          return (
            <button
              key={day.date}
              type="button"
              title={`${day.date}: ${day.rounds} kol, ${day.players} hráčů`}
              aria-label={`${day.date}: ${day.rounds} kol, ${day.players} hráčů`}
              onClick={() => onSelect(day.date)}
              className={className}
            >
              <span className={cn(!day.inMonth && "opacity-40")}>{dayNum}</span>
              {day.inMonth && day.rounds > 0 ? (
                <span className="text-[9px] leading-none opacity-80">{day.rounds}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDialog({
  date,
  days,
  onChange,
  onSelectPlayer,
}: {
  date: string | null;
  days: MarketingSnapshot["days"];
  onChange: (date: string | null) => void;
  onSelectPlayer: (nickname: string) => void;
}) {
  const log = date ? days[date] : undefined;
  const rounds = log?.rounds ?? [];
  const people = rounds.flatMap((round) => round.players);
  const uniqueNames = [...new Set(people.map((player) => player.name))];
  const emails = [...new Set(people.map((player) => player.email).filter((email): email is string => Boolean(email)))];
  const firsts = people.filter((player) => player.firstVisit).length;
  const games = [...new Set(rounds.map((round) => round.label))];
  const firstTee = rounds[0] ? formatClock(rounds[0].startedAt) : null;
  const lastFlag = rounds.length ? formatClock(rounds[rounds.length - 1].completedAt) : null;

  return (
    <Dialog.Root open={Boolean(date)} onOpenChange={(open) => !open && onChange(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-[8vh] z-[70] mx-auto max-h-[84vh] max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(13,61,60,0.28)] outline-none sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange">Den na jamkách</p>
              <Dialog.Title className="mt-1 font-display text-3xl font-semibold capitalize tracking-tight">
                {date ? formatDayTitle(date) : "Den"}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Kola, hráči a výsledky za vybraný den.
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-sm text-ink/60 ring-1 ring-ink/15 hover:text-teal"
                onClick={() => date && onChange(shiftDate(date, -1))}
              >
                Předchozí
              </button>
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-sm text-ink/60 ring-1 ring-ink/15 hover:text-teal"
                onClick={() => date && onChange(shiftDate(date, 1))}
              >
                Další
              </button>
              <Dialog.Close className="rounded-full px-3 py-1.5 text-sm text-ink/50 hover:text-ink">
                Zavřít
              </Dialog.Close>
            </div>
          </div>

          {rounds.length === 0 ? (
            <p className="mt-6 text-sm leading-6 text-ink/60">
              Tenhle den na jamkách nikdo nebyl. Klidný slot na kampaň, údržbu nebo firemní akci.
            </p>
          ) : (
            <>
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Kol" value={String(rounds.length)} />
                <MiniStat label="Hráčů" value={String(uniqueNames.length)} />
                <MiniStat label="První odpal" value={firstTee ?? "—"} />
                <MiniStat label="Poslední jamka" value={lastFlag ?? "—"} />
              </dl>
              <p className="mt-4 text-sm text-ink/60">
                {games.join(" · ")}
                {firsts > 0 ? ` · ${firsts} ${firsts === 1 ? "nová tvář" : "nových tváří"}` : ""}
                {emails.length > 0 ? ` · ${emails.length} e-mailů` : " · bez e-mailu"}
              </p>
              {emails.length > 0 ? (
                <button
                  type="button"
                  className="mt-3 rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
                  onClick={() => void navigator.clipboard.writeText(emails.join(", "))}
                >
                  Kopírovat e-maily dne
                </button>
              ) : null}

              <ul className="mt-6 space-y-4">
                {rounds.map((round) => (
                  <li key={round.id} className="rounded-2xl bg-mist p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-display text-xl font-semibold">
                        {formatClock(round.startedAt)} · {round.label}
                      </p>
                      <p className="text-sm text-ink/50">
                        {round.format ? `${round.format} · ` : ""}
                        {round.minutes} min
                        {round.finishedEarly ? " · předčasně" : ""}
                      </p>
                    </div>
                    <ol className="mt-3 space-y-2">
                      {round.players.map((player, index) => (
                        <li key={`${round.id}-${player.name}`} className="flex items-center justify-between gap-3 text-sm">
                          <span>
                            <span className="mr-2 tabular-nums text-ink/40">{index + 1}.</span>
                            <button
                              type="button"
                              className="font-semibold text-teal hover:underline"
                              onClick={() => onSelectPlayer(player.name)}
                            >
                              {player.name}
                            </button>
                            {player.firstVisit ? (
                              <span className="ml-2 rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange">
                                poprvé
                              </span>
                            ) : null}
                          </span>
                          <span className="tabular-nums text-ink/70">
                            {player.total} · {formatVsPar(player.vsPar)}
                            {player.email ? (
                              <>
                                {" "}
                                <a className="text-teal hover:underline" href={`mailto:${player.email}`}>
                                  {player.email}
                                </a>
                              </>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-mist px-3 py-2">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink/40">{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold">{value}</dd>
    </div>
  );
}

function PlayerDialog({
  player,
  onClose,
  picked,
  onPick,
}: {
  player: MarketingPlayer | null;
  onClose: () => void;
  picked: boolean;
  onPick: (nickname: string) => void;
}) {
  return (
    <Dialog.Root open={Boolean(player)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-forest-950/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-[8vh] z-[90] mx-auto max-h-[84vh] max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(13,61,60,0.28)] outline-none sm:p-8">
          {player ? (
            <>
              <div className="flex items-start gap-4">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt=""
                    className="size-16 rounded-full object-cover ring-2 ring-teal/30"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full bg-forest-100 font-display text-2xl text-teal">
                    {player.nickname.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange">Hráč</p>
                  <Dialog.Title className="mt-1 font-display text-3xl font-semibold tracking-tight">
                    {player.nickname}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-ink/60">
                    {player.name ?? "Jen přezdívka z kola"}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-full px-3 py-1.5 text-sm text-ink/50 hover:text-ink">
                  Zavřít
                </Dialog.Close>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat label="Věk" value={player.age != null ? String(player.age) : "—"} />
                <MiniStat label="Zařízení" value={platformLabel(player.platform)} />
                <MiniStat label="Jazyk" value={localeLabel(player.locale)} />
                <MiniStat label="Oblíbená hra" value={player.favoriteGame ? GAME_LABELS[player.favoriteGame] : "—"} />
                <MiniStat label="Kol" value={String(player.rounds)} />
                <MiniStat label="Vs par" value={formatVsPar(player.avgVsPar)} />
              </dl>

              <p className="mt-4 text-sm text-ink/70">
                {player.email ? (
                  <a className="text-teal hover:underline" href={`mailto:${player.email}`}>
                    {player.email}
                  </a>
                ) : (
                  "Bez e-mailu — kampaň do appky nedorazí."
                )}
              </p>
              {player.email && !player.noticesOptIn ? (
                <p className="mt-2 text-sm text-orange">Profil má, ale novinky v appce nemá zapnuté.</p>
              ) : null}
              {player.email && player.noticesOptIn ? (
                <p className="mt-2 text-sm text-teal">Novinky v appce bere.</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {player.email ? (
                  <>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
                      onClick={() => void navigator.clipboard.writeText(player.email ?? "")}
                    >
                      Kopírovat e-mail
                    </button>
                    <a
                      className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
                      href={`mailto:${player.email}`}
                    >
                      Otevřít e-mail
                    </a>
                  </>
                ) : null}
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
                  onClick={() => onPick(player.nickname)}
                >
                  {picked ? "Odebrat z kampaně" : "Přidat do výběru kampaně"}
                </button>
              </div>

              <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">Poslední návštěvy</h3>
              {player.history.length === 0 ? (
                <p className="mt-2 text-sm text-ink/50">Zatím bez odehraného kola.</p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {player.history.map((visit, index) => (
                    <li
                      key={`${visit.date}-${visit.gameType}-${index}`}
                      className="flex items-center justify-between rounded-2xl bg-mist px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="tabular-nums text-ink/50">{visit.date}</span>
                        <span className="ml-2 font-semibold">{visit.label}</span>
                      </span>
                      <span className="tabular-nums text-ink/70">
                        {visit.total} · {formatVsPar(visit.vsPar)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CampaignComposer({
  kind,
  title,
  message,
  players,
  pickedNames,
  picked,
  inboxable,
  ageFrom,
  ageTo,
  sending,
  history,
  historyLoading,
  onKind,
  onTitle,
  onMessage,
  onAgeFrom,
  onAgeTo,
  onToggle,
  onSelectAll,
  onClear,
  onReuse,
  onSend,
}: {
  kind: NoticeKind;
  title: string;
  message: string;
  players: MarketingPlayer[];
  pickedNames: Set<string>;
  picked: number;
  inboxable: number;
  ageFrom: string;
  ageTo: string;
  sending: boolean;
  history: AdminNotice[];
  historyLoading: boolean;
  onKind: (kind: NoticeKind) => void;
  onTitle: (value: string) => void;
  onMessage: (value: string) => void;
  onAgeFrom: (value: string) => void;
  onAgeTo: (value: string) => void;
  onToggle: (nickname: string) => void;
  onSelectAll: (nicknames: string[]) => void;
  onClear: () => void;
  onReuse: (item: AdminNotice) => void;
  onSend: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);
  const openHistory = history.find((item) => item.id === openHistoryId) ?? null;

  return (
    <Panel kicker="Kampaň do appky" title="Skladba zprávy">
      <p className="mb-4 text-sm text-ink/55">
        Zpráva čeká v inboxu, až appku otevřou. Lock-screen push necháváme na později. Jde jen na e-mail + souhlas
        s novinkami.
      </p>
      <div className="flex flex-wrap gap-2">
        {NOTICE_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onKind(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm",
              kind === item.id ? "bg-teal text-white" : "text-ink/70 ring-1 ring-ink/15 hover:text-orange",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink/70">
          Věk od
          <input
            value={ageFrom}
            onChange={(event) => onAgeFrom(event.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="—"
            className="mt-1 w-full rounded-full border border-ink/15 bg-mist px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
          />
        </label>
        <label className="text-sm text-ink/70">
          Věk do
          <input
            value={ageTo}
            onChange={(event) => onAgeTo(event.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="—"
            className="mt-1 w-full rounded-full border border-ink/15 bg-mist px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
        >
          Vybrat hráče
        </button>
        <button
          type="button"
          onClick={() => onSelectAll(players.map((player) => player.nickname))}
          className="rounded-full px-4 py-2 text-sm text-ink/70 ring-1 ring-ink/15 hover:text-orange"
        >
          Vybrat všechny
        </button>
        <p className="text-sm text-ink/50">
          Ve výběru {picked} · doručí se {inboxable}
        </p>
      </div>
      <label className="mt-4 block text-sm text-ink/70">
        Titulek
        <input
          value={title}
          onChange={(event) => onTitle(event.target.value)}
          maxLength={80}
          className="mt-1 w-full rounded-full border border-ink/15 bg-mist px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
        />
      </label>
      <label className="mt-4 block text-sm text-ink/70">
        Text
        <textarea
          value={message}
          onChange={(event) => onMessage(event.target.value)}
          maxLength={500}
          rows={4}
          className="mt-1 w-full rounded-3xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="rounded-full bg-teal px-5 py-2 text-sm text-white hover:bg-forest-800 disabled:opacity-50"
        >
          {sending ? "Posílám…" : `Odeslat do appky (${inboxable})`}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-4 py-2 text-sm text-ink/60 ring-1 ring-ink/15 hover:text-orange"
        >
          Vyčistit výběr
        </button>
      </div>
      <div className="mt-8 border-t border-ink/10 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange">Odeslané kampaně</p>
        <h3 className="mt-1 font-display text-2xl">Historie</h3>
        {historyLoading ? (
          <p className="mt-3 text-sm text-ink/50">Načítám odeslané zprávy…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">
            Zatím tu nic není. První kampaň se objeví hned po odeslání do appky.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenHistoryId(item.id)}
                  className="w-full rounded-[1.25rem] bg-mist/70 px-4 py-3 text-left hover:bg-white hover:ring-1 hover:ring-orange/30"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">
                      {noticeKindLabel(item.kind)} · {formatDateTime(item.createdAt)}
                    </p>
                    <p className="text-xs tabular-nums text-ink/45">
                      {item.sent} {item.sent === 1 ? "hráč" : item.sent >= 2 && item.sent <= 4 ? "hráči" : "hráčů"} ·
                      přečteno {item.read}
                    </p>
                  </div>
                  <p className="mt-1 font-medium">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink/50">{item.message}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <PlayerPickerDialog
        open={pickerOpen}
        players={players}
        pickedNames={pickedNames}
        onClose={() => setPickerOpen(false)}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        onClear={onClear}
      />
      <CampaignHistoryDialog
        item={openHistory}
        onClose={() => setOpenHistoryId(null)}
        onReuse={(item) => {
          onReuse(item);
          setOpenHistoryId(null);
        }}
      />
    </Panel>
  );
}

function CampaignHistoryDialog({
  item,
  onClose,
  onReuse,
}: {
  item: AdminNotice | null;
  onClose: () => void;
  onReuse: (item: AdminNotice) => void;
}) {
  return (
    <Dialog.Root open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-forest-950/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-[8vh] z-[70] mx-auto max-h-[84vh] max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(13,61,60,0.28)] outline-none sm:p-8">
          {item ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange">
                    {noticeKindLabel(item.kind)} · {formatDateTime(item.createdAt)}
                  </p>
                  <Dialog.Title className="mt-1 font-display text-3xl font-semibold tracking-tight">
                    {item.title}
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-ink/65">{item.message}</Dialog.Description>
                </div>
                <Dialog.Close className="rounded-full px-3 py-1.5 text-sm text-ink/50 hover:text-ink">Zavřít</Dialog.Close>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniStat label="Odesláno" value={String(item.sent)} />
                <MiniStat label="Přečteno" value={String(item.read)} />
                <MiniStat label="Čeká v inboxu" value={String(Math.max(0, item.sent - item.read))} />
              </dl>
              <div className="mt-4">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
                  onClick={() => onReuse(item)}
                >
                  Použít znovu
                </button>
              </div>
              <ul className="mt-5 divide-y divide-ink/10">
                {item.recipients.map((person) => (
                  <li key={person.nickname} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{person.nickname}</p>
                      <p className="truncate text-sm text-ink/45">{person.email || person.name || "bez e-mailu"}</p>
                    </div>
                    <p className="shrink-0 text-xs text-ink/45">
                      {person.readAt ? `Přečteno ${formatDateTime(person.readAt)}` : "Čeká"}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PlayerPickerDialog({
  open,
  players,
  pickedNames,
  onClose,
  onToggle,
  onSelectAll,
  onClear,
}: {
  open: boolean;
  players: MarketingPlayer[];
  pickedNames: Set<string>;
  onClose: () => void;
  onToggle: (nickname: string) => void;
  onSelectAll: (nicknames: string[]) => void;
  onClear: () => void;
}) {
  const [needle, setNeedle] = useState("");
  const visible = useMemo(() => {
    const query = needle.trim().toLocaleLowerCase("cs");
    if (!query) return players;
    return players.filter((player) =>
      [player.nickname, player.name, player.email, player.age]
        .filter((value) => value != null && value !== "")
        .join(" ")
        .toLocaleLowerCase("cs")
        .includes(query),
    );
  }, [players, needle]);
  const visibleNames = visible.map((player) => player.nickname);
  const allVisiblePicked = visible.length > 0 && visible.every((player) => pickedNames.has(player.nickname));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setNeedle("");
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-forest-950/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-[8vh] z-[90] mx-auto flex max-h-[84vh] max-w-lg flex-col overflow-hidden rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(13,61,60,0.28)] outline-none sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange">Kampaň</p>
              <Dialog.Title className="mt-1 font-display text-3xl font-semibold tracking-tight">
                Koho oslovit
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-ink/60">
                Zaškrtni konkrétní lidi, nebo vezmi všechny. Doručí se jen e-mail se souhlasem.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full px-3 py-1.5 text-sm text-ink/50 hover:text-ink">Zavřít</Dialog.Close>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectAll(visibleNames)}
              className="rounded-full px-4 py-2 text-sm text-teal ring-1 ring-teal/40 hover:bg-teal hover:text-white"
            >
              {allVisiblePicked ? "Zobrazení jsou vybraní" : `Vybrat ${needle.trim() ? "zobrazené" : "všechny"} (${visible.length})`}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-full px-4 py-2 text-sm text-ink/60 ring-1 ring-ink/15 hover:text-orange"
            >
              Vyčistit
            </button>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Hledat hráče</span>
            <input
              value={needle}
              onChange={(event) => setNeedle(event.target.value)}
              placeholder="Hledat jméno, e-mail…"
              className="w-full rounded-full border border-ink/15 bg-mist px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
            />
          </label>

          <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {visible.length === 0 ? (
              <li className="py-8 text-center text-sm text-ink/40">Nikdo takový v listině není.</li>
            ) : (
              visible.map((player) => {
                const canInbox = Boolean(player.email && player.noticesOptIn);
                return (
                  <li key={player.nickname}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 hover:bg-mist">
                      <input
                        type="checkbox"
                        checked={pickedNames.has(player.nickname)}
                        onChange={() => onToggle(player.nickname)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{player.nickname}</span>
                        <span className="block truncate text-xs text-ink/50">
                          {player.email ?? "bez e-mailu"}
                          {player.age != null ? ` · ${player.age} let` : ""}
                          {canInbox ? " · novinky bere" : " · kampaň nedorazí"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <p className="text-sm text-ink/50">
              Vybraných {pickedNames.size} z {players.length}
            </p>
            <Dialog.Close className="rounded-full bg-teal px-5 py-2 text-sm text-white hover:bg-forest-800">
              Hotovo
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
