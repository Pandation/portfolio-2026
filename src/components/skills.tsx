"use client";

import { useTranslations } from "next-intl";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { skills } from "@/data/profile";

const categoryKeys = ["languages", "frontend", "backend", "tools"] as const;

export function Skills() {
  const t = useTranslations("skills");
  const tCategories = useTranslations("skills.categories");

  return (
    <section id="skills" className="mx-auto max-w-6xl px-6 py-28">
      <SectionHeading kicker={t("kicker")} title={t("title")} />

      <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
        {categoryKeys.map((key) => (
          <RevealItem
            key={key}
            className="rounded-2xl border border-border bg-background-elevated/60 p-6"
          >
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
              {tCategories(key)}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {skills[key].map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground/85"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
