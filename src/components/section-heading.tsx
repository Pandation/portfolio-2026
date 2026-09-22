import { Reveal } from "@/components/reveal";

export function SectionHeading({
  kicker,
  title,
  align = "left",
}: {
  kicker: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={align === "center" ? "text-center" : "text-left"}>
      <p className="text-sm font-medium tracking-widest text-accent uppercase mb-3">
        {kicker}
      </p>
      <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
        {title}
      </h2>
    </Reveal>
  );
}
