"use client";

import { FiGlobe, FiChevronDown } from "react-icons/fi";
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
      // @ts-expect-error — pathname + params sempre batem
      { pathname, params },
      { locale: nextLocale as Locale }
    );
  }

  return (
    <div className="relative">
      <FiGlobe
        size={16}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />

      <select
        value={locale}
        onChange={(e) => onSelectChange(e.target.value)}
        className="
          pl-7 pr-6 h-8
          text-sm
          rounded-md
          border
          bg-white
          hover:bg-gray-50
          focus:outline-none
          focus:ring-2 focus:ring-blue-500
          appearance-none
          cursor-pointer
        "
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {loc.toUpperCase()}
          </option>
        ))}
      </select>

      <FiChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}