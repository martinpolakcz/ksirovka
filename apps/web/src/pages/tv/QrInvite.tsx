import { useMemo } from "react";
import { renderSVG } from "uqr";

export function QrInvite({ large = false }: { large?: boolean }) {
  const url = typeof window === "undefined" ? "https://ksirovka.cz/vysledky" : `${window.location.origin}/vysledky`;
  const svg = useMemo(
    () =>
      renderSVG(url, {
        pixelSize: large ? 8 : 6,
        border: 2,
        whiteColor: "#ffffff",
        blackColor: "#0eada7",
      }),
    [url, large],
  );

  return (
    <div
      className={
        large
          ? "tv-card flex h-full flex-col items-center justify-center gap-5 p-6"
          : "tv-card flex items-center gap-4 p-4"
      }
    >
      <div
        className={
          large
            ? "size-40 overflow-hidden rounded-3xl ring-1 ring-teal/30"
            : "size-28 shrink-0 overflow-hidden rounded-2xl ring-1 ring-teal/30"
        }
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className={large ? "text-center" : undefined}>
        <p className="text-sm font-semibold text-teal">Zahraj a jsi na TV</p>
        <p className="mt-1 text-2xl font-semibold leading-snug text-ink">Nahraj skóre v appce</p>
        <p className="mt-1 text-sm text-ink/55">Naskenuj a podívej se na žebříček. Další kolo můžeš být ty.</p>
      </div>
    </div>
  );
}
