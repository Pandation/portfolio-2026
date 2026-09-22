"use client";

import { useTranslations } from "next-intl";
import { Handshake, MapPin, RefreshCcw } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { highlights, yearsOfExperience } from "@/data/profile";

const icons = {
  refresh: RefreshCcw,
  handshake: Handshake,
};

export function About() {
  const t = useTranslations("about");

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

        <RevealGroup className="md:col-span-2 flex flex-col gap-4">
          <RevealItem className="rounded-2xl border border-border bg-background-elevated/60 p-6">
            <p className="font-display text-3xl font-semibold text-gradient">
              {yearsOfExperience}
            </p>
            <p className="mt-1 text-sm text-muted">{t("statsYears")}</p>
          </RevealItem>

          {highlights.map((h) => {
            const Icon = icons[h.icon];
            return (
              <RevealItem
                key={h.key}
                className="flex items-start gap-3 rounded-2xl border border-border bg-background-elevated/60 p-6"
              >
                <Icon size={20} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-sm leading-relaxed text-foreground/85">
                  {t(h.key)}
                </p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
