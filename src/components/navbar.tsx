"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Download } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { siteConfig } from "@/data/profile";

const navKeys = ["about", "experience", "projects", "skills", "contact"] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("top");
          }}
          className="font-display text-lg font-semibold tracking-tight"
        >
          {siteConfig.initials}
          <span className="text-accent">.</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navKeys.map((key) => (
            <button
              key={key}
              onClick={() => handleNavClick(key)}
              className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <a
            href={siteConfig.cvUrl}
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
          >
            <Download size={14} />
            {t("downloadCV")}
          </a>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-b border-border bg-background/95 backdrop-blur-md"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleNavClick(key)}
                  className="text-left text-base text-muted hover:text-foreground transition-colors"
                >
                  {t(key)}
                </button>
              ))}
              <div className="flex items-center justify-between pt-2">
                <LanguageSwitcher />
                <a
                  href={siteConfig.cvUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                >
                  <Download size={14} />
                  {t("downloadCV")}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
