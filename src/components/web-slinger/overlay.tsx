"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Github,
  LayoutGrid,
  Linkedin,
  Mail,
  Sparkles,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/data/profile";
import type { Slide } from "./slides";
import { type SlingerStore, useSlingerState, useSlingerStore } from "./store";

// Clavier, molette et swipe pilotent la cible du store.
function useNavigationInput(store: SlingerStore) {
  useEffect(() => {
    let lockedUntil = 0;
    const step = (dir: number) => {
      const now = performance.now();
      if (now < lockedUntil) return;
      lockedUntil = now + 650;
      if (dir > 0) store.next();
      else store.prev();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") step(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") step(-1);
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 18) step(Math.sign(e.deltaY));
    };
    let touch: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch) return;
      const dx = touch.x - e.changedTouches[0].clientX;
      const dy = touch.y - e.changedTouches[0].clientY;
      touch = null;
      const main = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(main) > 45) step(Math.sign(main));
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [store]);
}

const glass = "border border-white/10 bg-background/55 backdrop-blur-md";

function ProjectCard({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const t = useTranslations("slinger");
  const tp = useTranslations("projects");

  if (slide.kind === "contact") {
    return (
      <div className={`${glass} rounded-2xl p-5 sm:p-6`}>
        <p className="text-xs font-medium tracking-widest text-accent uppercase">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">{t("contactTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("contactText")}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-transform hover:scale-105"
          >
            <Mail size={15} />
            {siteConfig.email}
          </a>
          <a href={siteConfig.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-full border border-white/15 p-2.5 text-muted transition-colors hover:text-foreground">
            <Github size={16} />
          </a>
          <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-full border border-white/15 p-2.5 text-muted transition-colors hover:text-foreground">
            <Linkedin size={16} />
          </a>
        </div>
      </div>
    );
  }

  const { project } = slide;
  return (
    <div className={`${glass} rounded-2xl p-5 sm:p-6`}>
      <p className="flex items-center gap-2 text-xs font-medium tracking-widest text-accent uppercase">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        {project.featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 normal-case tracking-normal">
            <Sparkles size={11} />
            {tp("featured")}
          </span>
        )}
      </p>
      <h2 className="font-display mt-1.5 text-xl font-semibold sm:mt-2 sm:text-3xl">{project.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted sm:line-clamp-3">{project.description}</p>
      <div className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
        {project.stack.map((tech) => (
          <span key={tech} className="rounded-full border border-white/12 px-2.5 py-0.5 text-xs text-muted">
            {tech}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm sm:mt-5">
        {project.demoUrl && (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-medium text-white transition-transform hover:scale-105"
          >
            {tp("viewDemo")}
            <ArrowUpRight size={15} />
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-muted transition-colors hover:text-foreground"
          >
            <Github size={15} />
            {tp("viewCode")}
          </a>
        )}
      </div>
    </div>
  );
}

export function Overlay({ slides }: { slides: Slide[] }) {
  const t = useTranslations("slinger");
  const tn = useTranslations("nav");
  const th = useTranslations("hero");
  const store = useSlingerStore();
  const index = useSlingerState((s) => s.index);
  const target = useSlingerState((s) => s.target);
  const swinging = useSlingerState((s) => s.swinging);
  useNavigationInput(store);

  const shown = swinging ? target : index;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Barre du haut */}
      <header className="pointer-events-auto flex items-start justify-between gap-3">
        <div className={`${glass} flex items-center gap-3 rounded-2xl px-3.5 py-2.5`}>
          <span className="font-display flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background">
            {siteConfig.initials}
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-sm font-semibold sm:text-base">{siteConfig.name}</h1>
            <p className="text-xs text-muted">{th("role")}</p>
          </div>
        </div>

        <div
          className={`${glass} hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs text-muted lg:flex`}
          title={t("builtWithDetail")}
        >
          <Sparkles size={13} className="text-accent" />
          {t("builtWith")}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <a
            href={siteConfig.cvUrl}
            download
            className={`${glass} hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground sm:inline-flex`}
          >
            <Download size={13} />
            {tn("downloadCV")}
          </a>
          <Link
            href="/classic"
            className={`${glass} inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground`}
          >
            <LayoutGrid size={13} />
            <span className="hidden sm:inline">{t("classic")}</span>
          </Link>
        </div>
      </header>

      {/* Bas : carte projet + navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="pointer-events-auto w-full max-w-md" aria-live="polite">
          <AnimatePresence mode="wait">
            {swinging ? (
              <motion.p
                key="swinging"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`${glass} inline-block rounded-full px-4 py-2 text-xs tracking-widest text-muted uppercase`}
              >
                {t("swinging")}
              </motion.p>
            ) : (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectCard slide={slides[index]} index={index} total={slides.length} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="pointer-events-auto flex flex-col items-center gap-2 sm:items-end" aria-label={t("allProjects")}>
          <div className={`${glass} flex items-center gap-1 rounded-full p-1.5`}>
            <button
              type="button"
              onClick={store.prev}
              disabled={target === 0}
              aria-label={t("prev")}
              className="cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-foreground disabled:cursor-default disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 px-1">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => store.goTo(i)}
                  aria-label={t("goTo", { index: i + 1 })}
                  aria-current={i === shown}
                  className={`h-2 cursor-pointer rounded-full transition-all ${
                    i === shown ? "w-6 bg-accent" : "w-2 bg-white/30 hover:bg-white/60"
                  } ${slide.kind === "contact" ? "ring-1 ring-accent-secondary/60" : ""}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={store.next}
              disabled={target === slides.length - 1}
              aria-label={t("next")}
              className="cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-foreground disabled:cursor-default disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="hidden text-xs text-muted/80 sm:block">{t("hint")}</p>
        </nav>
      </div>

      {/* Liste complète pour les lecteurs d'écran et les moteurs de recherche. */}
      <ul className="sr-only">
        {slides.map((slide, i) =>
          slide.kind === "project" ? (
            <li key={i}>
              <h3>{slide.project.title}</h3>
              <p>{slide.project.description}</p>
              {slide.project.demoUrl && <a href={slide.project.demoUrl}>{t("openProject")}</a>}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}
