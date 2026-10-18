import { useMemo } from "react";
import { renderSVG } from "uqr";

export function QrInvite() {
  const url = typeof window === "undefined" ? "https://ksirovka.cz/vysledky" : `${window.location.origin}/vysledky`;
  const svg = useMemo(
    () =>
      renderSVG(url, {
        pixelSize: 7,
        border: 2,
        whiteColor: "#ffffff",
        blackColor: "#0eada7",
      }),
    [url],
  );

  return (
    <aside className="absolute bottom-[3.35rem] right-3 z-20 lg:bottom-[4.1rem] lg:right-5">
      <div className="flex items-center gap-3 rounded-[1.35rem] bg-white p-2.5 shadow-[0_16px_40px_rgba(14,173,167,0.22)] ring-1 ring-ink/10 lg:gap-3.5 lg:p-3">
        <div
          className="size-[5.25rem] overflow-hidden rounded-2xl ring-1 ring-teal/20 lg:size-[6.5rem]"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="pr-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">Naskenuj</p>
          <p className="mt-0.5 font-display text-lg font-semibold leading-tight text-ink lg:text-xl">
            Zahraj
            <br />
            a jsi na TV
          </p>
        </div>
      </div>
    </aside>
  );
}
