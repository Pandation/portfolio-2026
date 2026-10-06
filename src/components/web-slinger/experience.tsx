"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { Contact } from "@/components/contact";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Projects } from "@/components/projects";
import { Link } from "@/i18n/navigation";
import { type Locale, projects, siteConfig } from "@/data/profile";
import { Overlay } from "./overlay";
import { buildSlides } from "./slides";
import { SlingerProvider, useSlingerState } from "./store";

// Three.js ne tourne que dans le navigateur : la scène est chargée à part.
const Scene = dynamic(() => import("./scene"), { ssr: false });

type Mode = "checking" | "3d" | "fallback";

let webglSupport: boolean | undefined;

function canRender3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const subscribeNoop = () => () => {};

function LoadingScreen() {
  const t = useTranslations("slinger");
  const ready = useSlingerState((s) => s.ready);
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background"
        >
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
          <p className="text-xs tracking-widest text-muted uppercase">{t("loading")}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Fallback() {
  const t = useTranslations("slinger");
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <p className="font-display font-semibold">{siteConfig.name}</p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/classic"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            <LayoutGrid size={13} />
            {t("classic")}
          </Link>
        </div>
      </header>
      <p className="mx-auto mt-6 max-w-6xl px-6 text-sm text-muted">{t("fallbackNotice")}</p>
      <Projects />
      <Contact />
    </div>
  );
}

export function SlingerExperience() {
  const locale = useLocale() as Locale;
  const t = useTranslations("slinger");
  const slides = useMemo(() => buildSlides(projects[locale]), [locale]);
  const contact = useMemo(() => ({ title: t("contactTitle"), email: siteConfig.email }), [t]);
  // null côté serveur ; côté client, détecté une seule fois.
  const capable = useSyncExternalStore(subscribeNoop, canRender3D, () => null);
  const [fontsReady, setFontsReady] = useState(false);

  // Les panneaux sont dessinés avec les polices du site : on les attend.
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode: Mode = capable === false ? "fallback" : capable && fontsReady ? "3d" : "checking";

  if (mode === "fallback") return <Fallback />;

  return (
    <SlingerProvider count={slides.length}>
      <div className="relative h-dvh w-full overflow-hidden bg-background">
        <div className="absolute inset-0">{mode === "3d" && <Scene slides={slides} contact={contact} />}</div>
        <Overlay slides={slides} />
        <LoadingScreen />
      </div>
    </SlingerProvider>
  );
}
