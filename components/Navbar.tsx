import { FiHome, FiTool, FiFileText, FiShield } from "react-icons/fi";
import UserMenu from "./UserMenu";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/auth/user-profile";
import packageInfo from '../package.json';
import NavLink from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navbar");
  const session = await getSession();

  let isAdminUser = false;
  if (session) {
    const profile = await getUserProfile(session);
    isAdminUser = profile?.role === "admin";
  }

  const appVersion = packageInfo.version || "0.0.0";

  return (
    <nav className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sticky top-0 z-50 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* LEFT */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href={`/${locale}`} exact locale={locale} aria-label={t("home")}>
            <FiHome size={18} />
            <span className="hidden sm:inline">{t("home")}</span>
          </NavLink>

          <NavLink href={`/${locale}/tools`} locale={locale} aria-label={t("tools")}>
            <FiTool size={18} />
            <span className="hidden sm:inline">{t("tools")}</span>
          </NavLink>

          <NavLink href={`/${locale}/cv`} locale={locale} aria-label={t("resume")}>
            <FiFileText size={18} />
            <span className="hidden sm:inline">{t("resume")}</span>
          </NavLink>

          {isAdminUser && (
            <NavLink href={`/${locale}/admin`} locale={locale} aria-label={t("admin")}>
              <FiShield size={18} />
              <span className="hidden sm:inline">{t("admin")}</span>
            </NavLink>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu locale={locale} isLoggedIn={!!session} appVersion={appVersion} />
        </div>
      </div>
    </nav>
  );
}
