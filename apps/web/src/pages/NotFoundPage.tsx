import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
      <h1 className="font-display text-5xl font-semibold text-ink md:text-6xl">
        {t("errors.notFoundTitle")}
      </h1>
      <p className="mt-4 max-w-md text-ink/60">
        {t("errors.notFoundBefore")}{" "}
        <Link to="/" className="text-teal hover:underline">
          {t("errors.notFoundHome")}
        </Link>{" "}
        {t("errors.notFoundAfter")}
      </p>
    </div>
  );
}
