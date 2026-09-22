"use client";

import { useLocale, useTranslations } from "next-intl";
import { Briefcase, GraduationCap } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { experience, education, type Locale } from "@/data/profile";

export function Experience() {
  const t = useTranslations("experience");
  const locale = useLocale() as Locale;
  const work = experience[locale];
  const studies = education[locale];

  return (
    <section id="experience" className="mx-auto max-w-6xl px-6 py-28">
      <SectionHeading kicker={t("kicker")} title={t("title")} />

      <div className="mt-14 grid gap-16 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Reveal className="mb-8 flex items-center gap-2 text-sm font-medium text-muted">
            <Briefcase size={16} className="text-accent" />
            {t("workTitle")}
          </Reveal>

          <RevealGroup className="relative space-y-10 border-l border-border pl-8" stagger={0.12}>
            {work.map((job) => (
              <RevealItem key={`${job.company}-${job.period}`} className="relative">
                <span className="absolute -left-[2.32rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent" />
                <p className="text-xs font-medium uppercase tracking-wider text-accent">
                  {job.period}
                </p>
                <h3 className="font-display mt-1 text-lg font-semibold">
                  {job.role}
                </h3>
                <p className="text-sm text-muted">
                  {job.company} · {job.location}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {job.bullets.map((b) => (
                    <li key={b} className="text-sm leading-relaxed text-foreground/80">
                      — {b}
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div className="lg:col-span-2">
          <Reveal className="mb-8 flex items-center gap-2 text-sm font-medium text-muted">
            <GraduationCap size={16} className="text-accent" />
            {t("educationTitle")}
          </Reveal>

          <RevealGroup className="relative space-y-10 border-l border-border pl-8" stagger={0.12}>
            {studies.map((edu) => (
              <RevealItem key={`${edu.school}-${edu.period}`} className="relative">
                <span className="absolute -left-[2.32rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent-secondary" />
                <p className="text-xs font-medium uppercase tracking-wider text-accent-secondary">
                  {edu.period}
                </p>
                <h3 className="font-display mt-1 text-lg font-semibold">
                  {edu.degree}
                </h3>
                <p className="text-sm text-muted">{edu.school}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
