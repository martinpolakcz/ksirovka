import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { siteConfig } from "@/lib/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { useUiStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { mobileMenuOpen, setMobileMenuOpen, setScrolled } = useUiStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [setScrolled]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMenu(null);
  }, [location.pathname, setMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src="https://ksirovka.cz/images/logo.svg"
              alt={siteConfig.name}
              className="h-10 w-auto transition-transform group-hover:scale-105 md:h-12"
            />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex">
            {navigation.main.map((item) =>
              "children" in item ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === item.label ? null : item.label,
                      )
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-2 text-sm transition",
                      openMenu === item.label
                        ? "bg-mist text-teal"
                        : "text-ink/80 hover:bg-mist hover:text-teal",
                    )}
                    aria-expanded={openMenu === item.label}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition",
                        openMenu === item.label && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {openMenu === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 pt-2"
                      >
                        <div className="menu-panel max-h-[70vh] min-w-[320px] overflow-y-auto rounded-2xl p-3">
                          {item.children?.map((section) => (
                            <div key={section.label} className="mb-2 last:mb-0">
                              <Link
                                to={section.href}
                                className="block rounded-lg px-3 py-2 text-sm font-semibold text-teal hover:bg-mist"
                                onClick={() => setOpenMenu(null)}
                              >
                                {section.label}
                              </Link>
                              {section.children && (
                                <div className="ml-2 border-l border-ink/10 pl-2">
                                  {section.children.map((link) => (
                                    <Link
                                      key={link.href}
                                      to={link.href}
                                      className="block rounded-lg px-3 py-1.5 text-sm text-ink/75 hover:bg-mist hover:text-teal"
                                      onClick={() => setOpenMenu(null)}
                                    >
                                      {link.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink key={item.label} item={item} />
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-sm text-ink/70 hover:text-teal"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">{siteConfig.phone}</span>
            </a>
            <Button asChild size="sm">
              <a href="https://eshop.ksirovka.cz/rezervace" target="_blank" rel="noopener noreferrer">
                {t("common.reservation")}
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <div className="md:hidden">
              <LanguageSwitcher />
            </div>
            <button
              className="rounded-full p-2 text-ink"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t("common.menu")}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-white pt-20 xl:hidden"
          >
            <div className="px-6 pb-12">
              {navigation.main.map((item) =>
                "children" in item ? (
                  <div key={item.label} className="mb-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal">
                      {item.label}
                    </p>
                    {item.children?.map((section) => (
                      <div key={section.label} className="mb-4">
                        <Link
                          to={section.href}
                          className="block py-1 text-lg font-medium text-ink"
                        >
                          {section.label}
                        </Link>
                        {section.children?.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            className="block py-1 pl-4 text-sm text-ink/60"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <NavLink key={item.label} item={item} mobile />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  item,
  mobile,
}: {
  item: { label: string; href: string; external?: boolean; highlight?: boolean };
  mobile?: boolean;
}) {
  const className = cn(
    mobile
      ? "block py-2 text-lg font-medium text-ink"
      : "rounded-full px-3 py-2 text-sm text-ink/80 transition hover:bg-mist hover:text-teal",
    item.highlight && !mobile && "text-orange",
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {item.label}
    </Link>
  );
}
