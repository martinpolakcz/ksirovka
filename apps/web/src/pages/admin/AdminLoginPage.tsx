import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { api } from "@/lib/api";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useDocumentMeta({
    title: "Admin",
    description: "Správa TV tabule Kšírovky.",
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api.adminLogin(password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Přihlášení se nepovedlo");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-mist px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-ink/10"
      >
        <img
          src="https://ksirovka.cz/images/logo.svg"
          alt="Kšírovka"
          className="h-10"
        />
        <h1 className="mt-6 font-display text-4xl font-semibold text-ink">TV administrace</h1>
        <p className="mt-2 text-sm text-ink/50">Reklamy na golf a Hopsálkov a schování výsledků.</p>

        <label className="mt-8 block text-sm text-ink/70">
          Heslo
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-full bg-mist px-5 text-ink outline-none ring-1 ring-ink/10 focus:ring-teal"
            autoFocus
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Přihlašuji…" : "Vstoupit"}
        </Button>
      </form>
    </div>
  );
}
