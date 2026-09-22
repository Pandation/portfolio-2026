"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { stats, type Locale } from "@/data/profile";

export function About() {
  const t = useTranslations("about");
  const locale = useLocale() as Locale;
  const localeStats = stats[locale];

  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-28">
      <SectionHeading kicker={t("kicker")} title={t("title")} />

      <div className="mt-12 grid gap-12 md:grid-cols-5">
        <Reveal delay={0.1} className="md:col-span-3 space-y-5">
          <p className="text-lg leading-relaxed text-foreground/90">
            {t("paragraph1")}
          </p>
          <p className="text-base leading-relaxed text-muted">
            {t("paragraph2")}
          </p>
          <div className="flex items-center gap-2 pt-2 text-sm text-muted">
            <MapPin size={16} className="text-accent" />
            {t("location")}
          </div>
        </Reveal>

        <RevealGroup className="md:col-span-2 grid grid-cols-3 md:grid-cols-1 gap-4">
          {localeStats.map((s) => (
            <RevealItem
              key={s.key}
              className="rounded-2xl border border-border bg-background-elevated/60 p-6 text-center md:text-left"
            >
              <p className="font-display text-3xl font-semibold text-gradient">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted">{t(s.key)}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
