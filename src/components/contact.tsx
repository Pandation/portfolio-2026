"use client";

import { useTranslations } from "next-intl";
import { Github, Linkedin, Mail, MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { siteConfig } from "@/data/profile";

export function Contact() {
  const t = useTranslations("contact");

  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 py-28">
      <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-background-elevated/60 px-8 py-16 text-center sm:px-16">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]" />

        <p className="text-sm font-medium tracking-widest text-accent uppercase">
          {t("kicker")}
        </p>
        <h2 className="font-display mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
          {t("heading")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
          {t("paragraph")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-transform hover:scale-105"
          >
            <Mail size={16} />
            {t("emailCta")}
          </a>

          <div className="flex items-center gap-4">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href={siteConfig.linkedin}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin size={13} />
            {t("location")}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
