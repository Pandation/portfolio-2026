import type { Project } from "@/data/profile";

// Un arrêt du parcours : un projet par panneau, puis un panneau « contact ».
export type Slide = { kind: "project"; project: Project } | { kind: "contact" };

export function buildSlides(projects: Project[]): Slide[] {
  return [...projects.map((project) => ({ kind: "project" as const, project })), { kind: "contact" }];
}

export function slideLink(slide: Slide): string | undefined {
  return slide.kind === "project" ? (slide.project.demoUrl ?? slide.project.githubUrl) : undefined;
}
