"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Sparkles } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { projects, type Locale } from "@/data/profile";

export function Projects() {
  const t = useTranslations("projects");
  const locale = useLocale() as Locale;
  const items = projects[locale];

  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-28">
      <SectionHeading kicker={t("kicker")} title={t("title")} />

      <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
        {items.map((project) => (
          <RevealItem key={project.title}>
            <motion.article
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex h-full flex-col rounded-2xl border border-border bg-background-elevated/60 p-6 hover:border-accent/60 transition-colors"
            >
              {project.featured && (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  <Sparkles size={12} />
                  {t("featured")}
                </span>
              )}

              <h3 className="font-display text-lg font-semibold group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {project.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-sm">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors"
                  >
                    <Github size={15} />
                    {t("viewCode")}
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:text-accent-secondary transition-colors"
                  >
                    {t("viewDemo")}
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </motion.article>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
