"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiChevronDown, FiChevronUp, FiUser, FiLogIn, FiLogOut, FiTag, FiGlobe } from "react-icons/fi";
import { logoutFinance } from "@/app/[locale]/tools/finance/login/actions";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Locale, routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

type Props = {
  locale: string;
  isLoggedIn: boolean;
  appVersion: string;
};

export default function UserMenu({ locale: localeProp, isLoggedIn, appVersion }: Props) {
  const t = useTranslations("UserMenu");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [userLabel, setUserLabel] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setUserLabel(""); return; }
      if (user.displayName) { setUserLabel(user.displayName.split(" ")[0]); return; }
      if (user.email) { setUserLabel(user.email.split("@")[0]); return; }
      setUserLabel(t("account"));
    });
    return () => unsub();
  }, []);

  const chevron = useMemo(
    () => (open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />),
    [open]
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const buttonLabel = isLoggedIn ? (userLabel || t("account")) : t("login");

  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();

  function changeLocale(nextLocale: string) {
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
        title={buttonLabel}
      >
        <FiUser size={16} />
        <span className="hidden sm:inline text-sm font-medium max-w-[140px] truncate text-[var(--color-text-primary)]">
          {buttonLabel}
        </span>
        <span className="text-[var(--color-text-muted)]">{chevron}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-50">
          {/* IDIOMA */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase">
              <FiGlobe size={14} />
              {t("language")}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {routing.locales.map((loc) => {
                const active = loc === locale;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => changeLocale(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      active
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-[var(--color-accent-primary)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
                    }`}
                  >
                    {loc.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[var(--color-border-subtle)]" />

          {/* ENTRAR / SAIR */}
          <div className="p-1">
            {isLoggedIn ? (
              <form action={logoutFinance} className="w-full">
                <input type="hidden" name="locale" value={localeProp} />
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-[var(--color-surface-raised)] transition"
                >
                  <FiLogOut size={16} />
                  <span className="font-medium">{t("logout")}</span>
                </button>
              </form>
            ) : (
              <Link
                href={`/${localeProp}/tools/finance/login`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--color-accent-text)] hover:bg-[var(--color-accent-subtle)] transition"
              >
                <FiLogIn size={16} />
                <span className="font-medium">{t("login")}</span>
              </Link>
            )}
          </div>

          <div className="h-px bg-[var(--color-border-subtle)]" />

          {/* RELEASES */}
          <Link
            href={`/${localeProp}/releases`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition"
            title={t("versionTitle", { version: appVersion })}
          >
            <div className="flex items-center gap-2">
              <FiTag size={16} className="text-[var(--color-text-muted)]" />
              <span className="font-medium">{t("releases")}</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">v{appVersion}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
