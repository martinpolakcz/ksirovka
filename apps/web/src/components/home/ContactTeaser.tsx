import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export function ContactTeaser() {
  const { t } = useTranslation();

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-[2rem] bg-mist"
        >
          <div className="grid lg:grid-cols-2">
            <div className="p-8 md:p-12 lg:p-16">
              <h2 className="font-display text-4xl font-semibold text-ink md:text-5xl">
                {t("home.contactTitle")}
              </h2>

              <div className="mt-10 space-y-8">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">
                    {t("home.whereToFind")}
                  </h3>
                  <p className="flex items-start gap-3 text-ink/80">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-teal" />
                    <span>
                      {siteConfig.address.street}
                      <br />
                      {siteConfig.address.city}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">
                    {t("common.reservation")}
                  </h3>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 text-xl text-ink hover:text-teal"
                  >
                    <Phone className="h-5 w-5 text-teal" />
                    {siteConfig.phone}
                  </a>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">
                    {t("common.email")}
                  </h3>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-center gap-3 text-ink/80 hover:text-teal"
                  >
                    <Mail className="h-5 w-5 text-teal" />
                    {siteConfig.email}
                  </a>
                </div>
              </div>

              <Button asChild variant="outline" className="mt-10">
                <Link to="/kontakt">{t("footer.fullContacts")}</Link>
              </Button>
            </div>

            <div className="relative min-h-[300px] lg:min-h-full">
              <iframe
                title={t("contact.mapTitle")}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2607.8!2d16.6!3d49.17!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zS8OhxZtpcm92a2E!5e0!3m2!1scs!2scz!4v1"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
