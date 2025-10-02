"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Locale, routing } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

export default function SelectLanguage() {
  const router = useRouter();
  const locale = useLocale();

  const pathname = usePathname();
  const params = useParams();

  function onSelectChange(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- TypeScript will validate that only known `params`
      // are used in combination with a given `pathname`. Since the two will
      // always match for the current route, we can skip runtime checks.
      { pathname, params },
      { locale: nextLocale as Locale }
    );
  }

  return (
    <select
        defaultValue={locale}
        onChange={(e) => onSelectChange(e.target.value)}
        className="w-[95px] h-8 border bg-white rounded"
        >
        {routing.locales.map((loc) => (
            <option key={loc} value={loc}>
            {loc.toUpperCase()}
            </option>
        ))}
    </select>
  );
}
