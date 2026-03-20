"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiGlobe, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Locale, routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function SelectLanguage() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("Navbar");

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const chevron = useMemo(() => (open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />), [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function onSelectChange(nextLocale: string) {
    setOpen(false);
    router.replace(
      // @ts-expect-error — pathname + params sempre batem
      { pathname, params },
      { locale: nextLocale as Locale }
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition"
        title={t("language")}
      >
        <FiGlobe size={16} />
        <span className="hidden sm:inline text-sm font-medium">{locale.toUpperCase()}</span>
        <span className="text-[var(--color-text-muted)]">{chevron}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-50">
          {routing.locales.map((loc) => {
            const active = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onSelectChange(loc)}
                className={`w-full text-left px-4 py-2.5 text-sm transition ${
                  active
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                {loc.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
