import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n/languages";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ??
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const changeLanguage = (code: LanguageCode) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-ink/80 transition hover:bg-mist hover:text-teal"
        aria-expanded={open}
        aria-label={t("common.language")}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="uppercase">{current.code}</span>
      </button>

      {open && (
        <div className="menu-panel absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-52 overflow-y-auto rounded-2xl p-2 shadow-2xl">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-teal">
            {t("common.language")}
          </p>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-mist",
                i18n.language === lang.code
                  ? "bg-mist text-teal"
                  : "text-ink/80",
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {i18n.language === lang.code && (
                <Check className="h-4 w-4 text-teal" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
