import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { encodeMediaUrl } from "@/lib/utils";

type GalleryLightboxProps = {
  /** Root element that contains .ea-photogallery-item links */
  containerRef: React.RefObject<HTMLElement | null>;
};

export function GalleryLightbox({ containerRef }: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const show = images[index] ? encodeMediaUrl(images[index]) : null;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.("a.ea-photogallery-item") as HTMLAnchorElement | null;
      if (!link || !root.contains(link)) return;

      event.preventDefault();
      event.stopPropagation();

      const items = Array.from(
        root.querySelectorAll<HTMLAnchorElement>("a.ea-photogallery-item"),
      );
      const urls = items
        .map((a) => a.getAttribute("href") || a.querySelector("img")?.getAttribute("src") || "")
        .filter(Boolean)
        .map(encodeMediaUrl);

      if (!urls.length) return;

      const clicked =
        encodeMediaUrl(link.getAttribute("href") || link.querySelector("img")?.getAttribute("src") || "") ||
        urls[0];
      const start = Math.max(0, urls.indexOf(clicked));

      setImages(urls);
      setIndex(start);
      setOpen(true);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [containerRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-forest-950/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Fotogalerie</Dialog.Title>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Zavřít"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 md:left-6"
                aria-label="Předchozí"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 md:right-6"
                aria-label="Další"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {show && (
            <img
              src={show}
              alt=""
              className="max-h-[85vh] max-w-[min(96vw,1200px)] rounded-xl object-contain shadow-2xl"
            />
          )}

          {images.length > 1 && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-sm text-white/80">
              {index + 1} / {images.length}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
