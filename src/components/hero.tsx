"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import { siteConfig } from "@/data/profile";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  const t = useTranslations("hero");

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden bg-grid"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-glow absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[120px]" />
        <div className="animate-glow absolute right-0 bottom-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-accent-secondary/15 blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative mx-auto w-full max-w-6xl px-6 pt-24"
      >
        <motion.p
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated/60 px-4 py-1.5 text-xs font-medium text-muted"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t("eyebrow")}
        </motion.p>

        <motion.p variants={item} className="text-lg text-muted mb-2">
          {t("greeting")}
        </motion.p>

        <motion.h1
          variants={item}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance"
        >
          {siteConfig.name}
        </motion.h1>

        <motion.h2
          variants={item}
          className="text-gradient font-display mt-3 text-2xl sm:text-3xl font-semibold"
        >
          {t("role")}
        </motion.h2>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted"
        >
          {t("pitch")}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={() => scrollTo("projects")}
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-transform hover:scale-105 cursor-pointer"
          >
            {t("ctaProjects")}
          </button>
          <button
            onClick={() => scrollTo("contact")}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent cursor-pointer"
          >
            {t("ctaContact")}
          </button>

          <div className="flex items-center gap-3 pl-2">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-2.5 text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href={siteConfig.linkedin}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-2.5 text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="rounded-full border border-border p-2.5 text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
          </div>
        </motion.div>
      </motion.div>

      <motion.button
        onClick={() => scrollTo("about")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs text-muted cursor-pointer"
      >
        {t("scroll")}
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} />
        </motion.span>
      </motion.button>
    </section>
  );
}
