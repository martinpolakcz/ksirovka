import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Encode each path segment so spaces (e.g. "banery /") work in <img src>. */
export function encodeMediaUrl(url: string): string {
  if (!url || url.startsWith("data:") || url.startsWith("mailto:") || url.startsWith("tel:")) {
    return url;
  }

  try {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
      const absolute = url.startsWith("//") ? `https:${url}` : url;
      const parsed = new URL(absolute);
      parsed.pathname = parsed.pathname
        .split("/")
        .map((segment) => {
          if (!segment) return segment;
          try {
            return encodeURIComponent(decodeURIComponent(segment));
          } catch {
            return encodeURIComponent(segment);
          }
        })
        .join("/");
      return parsed.toString();
    }
  } catch {
    // fall through to relative handling
  }

  const normalized = url.startsWith("/") ? url : `/${url}`;
  return normalized
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join("/");
}

export function assetUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("//")) {
    return encodeMediaUrl(path);
  }
  const encoded = encodeMediaUrl(path);
  if (import.meta.env.DEV) {
    return `/media${encoded}`;
  }
  return `https://ksirovka.cz${encoded}`;
}
