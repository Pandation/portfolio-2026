"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background-elevated/60 p-1 text-xs font-medium">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => router.replace(pathname, { locale: loc })}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors cursor-pointer ${
            loc === locale
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
          aria-current={loc === locale}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
