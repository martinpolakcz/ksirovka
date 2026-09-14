import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AdminAuthError, api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const NAV = [
  { to: "/admin", label: "Reklamy", end: true },
  { to: "/admin/kola", label: "Kola", end: false },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useDocumentMeta({
    title: "Admin",
    description: "Správa TV tabule Kšírovky.",
  });

  useEffect(() => {
    let cancelled = false;
    api
      .adminMe()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        if (error instanceof AdminAuthError) {
          navigate("/admin/login", { replace: true });
          return;
        }
        navigate("/admin/login", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function logout() {
    await api.adminLogout();
    navigate("/admin/login", { replace: true });
  }

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper text-ink/60">
        Kontroluji přístup…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <p className="font-display text-2xl font-semibold">TV admin</p>
            <nav className="flex gap-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-4 py-1.5 text-sm",
                      isActive ? "bg-orange text-white" : "text-ink/60 hover:text-teal",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tv" className="rounded-full px-4 py-1.5 text-sm text-teal ring-1 ring-teal/40">
              Náhled TV
            </Link>
            <button type="button" onClick={() => void logout()} className="text-sm text-ink/50 hover:text-ink">
              Odhlásit
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
