import { useEffect } from "react";

export function useKiosk() {
  useEffect(() => {
    document.documentElement.classList.add("tv-kiosk");

    let wake: WakeLockSentinel | null = null;
    const requestWake = async () => {
      try {
        wake = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // prohlížeč TV nemusí Wake Lock umět
      }
    };
    void requestWake();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void requestWake();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let hideTimer = 0;
    const showCursor = () => {
      document.documentElement.classList.remove("tv-hide-cursor");
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        document.documentElement.classList.add("tv-hide-cursor");
      }, 3000);
    };
    showCursor();
    window.addEventListener("mousemove", showCursor);

    return () => {
      document.documentElement.classList.remove("tv-kiosk", "tv-hide-cursor");
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", showCursor);
      window.clearTimeout(hideTimer);
      void wake?.release();
    };
  }, []);
}

export function usePrefersReducedMotion() {
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}
