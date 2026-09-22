"use client";

import { useTranslations } from "next-intl";
import { siteConfig } from "@/data/profile";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  const scrollTop = () =>
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-6 py-8 text-xs text-muted sm:flex-row sm:justify-between">
        <p>
          © {year} {siteConfig.name}. {t("rights")}
        </p>
        <button
          onClick={scrollTop}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          {t("backToTop")} ↑
        </button>
      </div>
    </footer>
  );
}
