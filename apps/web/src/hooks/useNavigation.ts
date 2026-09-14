import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { navigationStructure } from "@/lib/navigation";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  highlight?: boolean;
};

type NavSection = NavLink & {
  children?: NavLink[];
};

type NavOffer = {
  label: string;
  children: NavSection[];
};

export function useNavigation() {
  const { t } = useTranslation();

  return useMemo(() => {
    const translate = (key: string) => t(`nav.${key}`);

    const main = navigationStructure.main.map((item) => {
      if ("children" in item) {
        return {
          label: translate(item.key),
          children: item.children.map((section) => ({
            label: translate(section.key),
            href: section.href,
            children: section.children?.map((link) => ({
              label: translate(link.key),
              href: link.href,
            })),
          })),
        } satisfies NavOffer;
      }

      return {
        label: translate(item.key),
        href: item.href,
        external: "external" in item ? item.external : undefined,
        highlight: "highlight" in item ? item.highlight : undefined,
      } satisfies NavLink;
    });

    const footer = navigationStructure.footer.map((item) => ({
      label: translate(item.key),
      href: item.href,
    }));

    return { main, footer };
  }, [t]);
}
