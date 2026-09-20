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
          ? "tv-card flex flex-col items-center justify-center gap-4 p-5 lg:h-full lg:gap-5 lg:p-6"
          : "tv-card flex items-center gap-3 p-4 lg:gap-4"
      }
    >
      <div
        className={
          large
            ? "size-32 overflow-hidden rounded-3xl ring-1 ring-teal/30 lg:size-40"
            : "size-20 shrink-0 overflow-hidden rounded-2xl ring-1 ring-teal/30 lg:size-28"
        }
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className={large ? "text-center" : undefined}>
        <p className="text-sm font-semibold text-teal">Zahraj a jsi na TV</p>
        <p className="mt-1 text-lg font-semibold leading-snug text-ink lg:text-2xl">Nahraj skóre v appce</p>
        <p className="mt-1 text-sm text-ink/55">Naskenuj a podívej se na žebříček. Další kolo můžeš být ty.</p>
      </div>
    </div>
  );
}
