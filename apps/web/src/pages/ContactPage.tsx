import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/lib/navigation";
import { api, isStaticOnly } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
};

function openMailto(data: ContactForm) {
  const subject = encodeURIComponent(`Kontakt z webu – ${data.firstName} ${data.lastName}`);
  const body = encodeURIComponent(
    [
      `Jméno: ${data.firstName} ${data.lastName}`,
      `E-mail: ${data.email}`,
      data.phone ? `Telefon: ${data.phone}` : null,
      "",
      data.message,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${body}`;
}

export function ContactPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useDocumentMeta({
    title: t("contact.title"),
    description: t("contact.formTitle"),
  });

  const contactFormSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(1, t("contact.firstName")),
        lastName: z.string().min(1, t("contact.lastName")),
        email: z.string().email(t("contact.email")),
        phone: z.string().optional(),
        message: z.string().min(10, t("contact.message")),
        website: z.string().optional(),
      }),
    [t],
  );

  const contacts = useMemo(
    () => [
      {
        title: t("common.reservation"),
        phone: "+420 605 700 717",
      },
      {
        title: t("contact.hopsalkov"),
        phone: "+420 603 166 466",
      },
      {
        title: t("contact.reception"),
        email: "recepce@ksirovka.cz",
        phone: "+420 605 700 717",
      },
      {
        title: t("contact.operations"),
        name: "Ing. Kateřina Jurečková",
        email: "katerina.jureckova@ksirovka.cz",
        phone: "+420 603 248 565",
      },
      {
        title: t("contact.bodyStudio"),
        name: "Mgr. Lenka Zeman Fučíková",
        email: "lenusa.fucikova@seznam.cz",
        phone: "+420 731 507 070",
      },
    ],
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { website: "" },
  });

  const onSubmit = async (data: ContactForm) => {
    setSubmitError(null);
    try {
      const res = await api.submitContact(data);
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || json?.ok === false) throw new Error("Submit failed");
      setSubmitted(true);
      reset({ website: "" });
    } catch {
      if (isStaticOnly) {
        openMailto(data);
        setSubmitted(true);
        reset({ website: "" });
        return;
      }
      setSubmitError(t("contact.submitError"));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-semibold text-ink md:text-6xl"
        >
          {t("contact.title")}
        </motion.h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            {contacts.map((c) => (
              <div key={c.title} className="rounded-2xl bg-mist p-6">
                <h3 className="font-semibold text-teal">{c.title}</h3>
                {c.name && <p className="mt-1 text-ink">{c.name}</p>}
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="mt-2 flex items-center gap-2 text-ink/80 hover:text-teal"
                  >
                    <Phone className="h-4 w-4" />
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="mt-1 flex items-center gap-2 text-ink/80 hover:text-teal"
                  >
                    <Mail className="h-4 w-4" />
                    {c.email}
                  </a>
                )}
              </div>
            ))}

            <div className="rounded-2xl bg-mist p-6">
              <h3 className="font-semibold text-teal">{t("contact.whereToFind")}</h3>
              <p className="mt-2 flex items-start gap-2 text-ink/80">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span>
                  {siteConfig.address.street}
                  <br />
                  {siteConfig.address.city}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-mist p-8">
            <h2 className="font-display text-2xl font-semibold text-ink">{t("contact.formHeading")}</h2>

            {submitted ? (
              <p className="mt-6 text-teal">{t("contact.success")}</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                {/* Honeypot */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  aria-hidden
                  {...register("website")}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-ink/60">
                      {t("contact.firstName")}
                    </label>
                    <input
                      {...register("firstName")}
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-ink/60">
                      {t("contact.lastName")}
                    </label>
                    <input
                      {...register("lastName")}
                      className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-ink/60">{t("contact.email")}</label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm text-ink/60">{t("contact.phone")}</label>
                  <input
                    {...register("phone")}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-ink/60">
                    {t("contact.messageLabel")}
                  </label>
                  <textarea
                    rows={5}
                    {...register("message")}
                    className="w-full resize-none rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-teal"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>
                  )}
                </div>

                {submitError && <p className="text-sm text-red-400">{submitError}</p>}

                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? t("common.sending") : t("common.send")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
