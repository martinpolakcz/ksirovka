const API_BASE = "/api/v1";

/** FTP / static hosting build — no backend API available */
export const isStaticOnly = import.meta.env.VITE_STATIC_ONLY === "true";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string | null;
  contentHtml: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
}

export interface ActivityTile {
  id: number;
  slug: string;
  label: string;
  href: string;
  imageUrl: string;
  sortOrder: number;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  coverImage: string | null;
  publishedAt: string | null;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  contentHtml: string;
  heroImage: string | null;
  template: string;
}

export interface HomepageData {
  heroSlides: HeroSlide[];
  activityTiles: ActivityTile[];
  articles: Article[];
  galleries: Array<{ id: number; slug: string; title: string }>;
  contact: {
    phone: string;
    email: string;
    address: { street: string; city: string };
  };
}

export type ScorePeriod = "day" | "week" | "month" | "year";
export type ScoreGameType = "fotbalgolf" | "minigolf" | "adventure";

export interface ScorecardStats {
  period: ScorePeriod;
  gameType: ScoreGameType | null;
  from: string;
  to: string;
  summary: {
    rounds: number;
    players: number;
    bestScore: { playerName: string; total: number; gameType: ScoreGameType } | null;
  };
  playerLeaderboard: Array<{
    rank: number;
    playerName: string;
    gameType: ScoreGameType;
    bestTotal: number;
    avgTotal: number;
    rounds: number;
  }>;
  holeLeaderboard: Array<{
    hole: number;
    gameType: ScoreGameType;
    par: number;
    avgScore: number;
    vsPar: number;
    bestScore: number;
    bestPlayer: string;
    plays: number;
  }>;
  hardestHoles: Array<{
    hole: number;
    gameType: ScoreGameType;
    par: number;
    avgScore: number;
    vsPar: number;
    bestScore: number;
    bestPlayer: string;
    plays: number;
  }>;
  recentRounds: Array<{
    id: number;
    gameType: ScoreGameType;
    format: string;
    completedAt: string;
    finishedEarly: boolean;
    holesPlayed: number;
    playerCount: number;
    winnerName: string;
    winnerTotal: number;
    standings: Array<{ name: string; total: number; rank: number }>;
  }>;
}

export type TvPromoCategory = "golf" | "hopsalkov" | "venue";
export type TvPromoSlot = "ticker" | "featured";

export interface TvPromo {
  id: number;
  slot: TvPromoSlot;
  category: TvPromoCategory;
  title: string;
  message: string;
  href: string | null;
  imageUrl: string | null;
  active?: boolean;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface TvBoard {
  promos: {
    ticker: TvPromo[];
    featured: TvPromo[];
  };
}

export interface AdminRound {
  id: number;
  gameType: ScoreGameType;
  format: string;
  completedAt: string;
  finishedEarly: boolean;
  holesPlayed: number;
  hidden: boolean;
  winnerName: string;
  winnerTotal: number;
  playerNames: string[];
}

export type AdminTvDataSettingsInput = {
  retentionEnabled: boolean;
  retentionDays: number;
  runHour: number;
};

export type AdminTvDataPurgeInput =
  | { scope: "all" }
  | { scope: "today" }
  | { scope: "older_than"; days: number }
  | { scope: "ids"; ids: number[] };

export interface AdminTvData {
  settings: AdminTvDataSettingsInput & {
    lastPurgeAt: string | null;
    lastPurgeDeleted: number;
    updatedAt: string;
  };
  counts: {
    total: number;
    today: number;
    olderThanRetention: number;
  };
}

export class AdminAuthError extends Error {
  constructor() {
    super("Nepřihlášen");
    this.name = "AdminAuthError";
  }
}

async function fetchAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (res.status === 401) {
    throw new AdminAuthError();
  }

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // keep status message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export type PromoPayload = {
  slot: TvPromoSlot;
  category: TvPromoCategory;
  title: string;
  message: string;
  href?: string | null;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
};

export const api = {
  getHomepage: () => fetchApi<HomepageData>("/homepage"),
  getPage: (slug: string) => fetchApi<Page>(`/pages/${slug}`),
  getArticles: (limit = 20, offset = 0) =>
    fetchApi<{ items: Article[] }>(`/articles?limit=${limit}&offset=${offset}`),
  getArticle: (slug: string) => fetchApi<Article>(`/articles/${slug}`),
  submitContact: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message: string;
    website?: string;
  }) => {
    const payload = JSON.stringify(data);
    if (isStaticOnly) {
      return fetch("/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    }
    return fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
  },
  getScorecardStats: (period: ScorePeriod = "week", gameType?: ScoreGameType | "all") => {
    const params = new URLSearchParams({ period });
    if (gameType && gameType !== "all") params.set("gameType", gameType);
    return fetchApi<ScorecardStats>(`/scorecard/stats?${params.toString()}`);
  },
  getTvBoard: () => fetchApi<TvBoard>("/tv/board"),
  adminLogin: (password: string) =>
    fetchAdmin<{ ok: boolean }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  adminLogout: () => fetchAdmin<{ ok: boolean }>("/admin/logout", { method: "POST" }),
  adminMe: () => fetchAdmin<{ ok: boolean }>("/admin/me"),
  getAdminPromos: () => fetchAdmin<{ items: TvPromo[] }>("/admin/promos"),
  createAdminPromo: (payload: PromoPayload) =>
    fetchAdmin<{ item: TvPromo }>("/admin/promos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAdminPromo: (id: number, payload: Partial<PromoPayload>) =>
    fetchAdmin<{ item: TvPromo }>(`/admin/promos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAdminPromo: (id: number) =>
    fetchAdmin<void>(`/admin/promos/${id}`, { method: "DELETE" }),
  getAdminRounds: (limit = 50) =>
    fetchAdmin<{ items: AdminRound[] }>(`/admin/rounds?limit=${limit}`),
  hideAdminRound: (id: number, hidden: boolean) =>
    fetchAdmin<{ item: { id: number; hidden: boolean } }>(`/admin/rounds/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ hidden }),
    }),
  deleteAdminRound: (id: number) => fetchAdmin<void>(`/admin/rounds/${id}`, { method: "DELETE" }),
  getAdminTvData: () => fetchAdmin<AdminTvData>("/admin/tv-data"),
  saveAdminTvData: (payload: AdminTvDataSettingsInput) =>
    fetchAdmin<AdminTvData>("/admin/tv-data", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  purgeAdminTvData: (payload: AdminTvDataPurgeInput) =>
    fetchAdmin<{ deleted: number }>("/admin/tv-data/purge", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
