import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, MapPin, Mail, Phone } from "lucide-react";
import { siteConfig } from "@/lib/navigation";
import { useNavigation } from "@/hooks/useNavigation";

export function Footer() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <footer className="bg-teal text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <img
              src="https://ksirovka.cz/images/logo-white.svg"
              alt={siteConfig.name}
              className="h-12 w-auto"
            />
            <div className="flex gap-4">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/15 p-3 text-white transition hover:bg-white/25"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/15 p-3 text-white transition hover:bg-white/25"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.contact")}</h3>
            <div className="space-y-3 text-sm text-white/85">
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {siteConfig.phone}
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {siteConfig.email}
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {siteConfig.address.street}
                  <br />
                  {siteConfig.address.city}
                </div>
              </div>
            </div>
            <Link to="/kontakt" className="text-sm text-white hover:underline">
              {t("footer.fullContacts")} →
            </Link>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.services")}</h3>
            <ul className="space-y-2">
              {navigation.footer.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-white/85 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm text-white/85">
              <li>
                <Link to="/novinky" className="hover:text-white">
                  {t("nav.news")}
                </Link>
              </li>
              <li>
                <Link to="/foto" className="hover:text-white">
                  {t("nav.gallery")}
                </Link>
              </li>
              <li>
                <Link to="/provozni-doba" className="hover:text-white">
                  {t("nav.openingHours")}
                </Link>
              </li>
              <li>
                <a
                  href="https://eshop.ksirovka.cz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {t("nav.vouchers")}
                </a>
              </li>
              <li>
                <a
                  href="https://eshop.ksirovka.cz/rezervace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {t("nav.reservation")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-8 text-center text-xs text-white/70">
          © {new Date().getFullYear()} {siteConfig.name} – {t("site.tagline")}
        </div>
      </div>
    </footer>
  );
}
