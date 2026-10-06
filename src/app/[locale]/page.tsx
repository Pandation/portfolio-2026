import { setRequestLocale } from "next-intl/server";
import { SlingerExperience } from "@/components/web-slinger/experience";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex-1">
      <SlingerExperience />
    </main>
  );
}
