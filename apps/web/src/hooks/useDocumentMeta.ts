import { useEffect } from "react";
import { siteConfig } from "@/lib/navigation";

type DocumentMetaOptions = {
  title?: string | null;
  description?: string | null;
};

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertOg(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export function useDocumentMeta({ title, description }: DocumentMetaOptions) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${siteConfig.name}`
      : `${siteConfig.name} – areál sportu a zábavy`;

    document.title = fullTitle;
    upsertOg("og:title", fullTitle);

    if (description) {
      upsertMeta("description", description);
      upsertOg("og:description", description);
    }
  }, [title, description]);
}
