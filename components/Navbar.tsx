import { FiHome, FiTool, FiFileText } from "react-icons/fi";
import UserMenu from "./UserMenu";
import { getTranslations } from "next-intl/server";
import packageInfo from '../package.json';
import NavLink from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import { cookies } from "next/headers";
import FinanceNotificationBell from "@/components/finance/FinanceNotificationBell";

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navbar");
  const cookieStore = await cookies();
  const hasFinanceSession = !!cookieStore.get("finance_session")?.value;

  const appVersion = packageInfo.version || "0.0.0";

  return (
    <nav className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* LEFT */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href={`/${locale}`} exact locale={locale}>
            <FiHome size={18} />
            <span className="hidden sm:inline">{t("home")}</span>
          </NavLink>

          <NavLink href={`/${locale}/tools`} locale={locale}>
            <FiTool size={18} />
            <span className="hidden sm:inline">{t("tools")}</span>
          </NavLink>

          <NavLink href={`/${locale}/cv`} locale={locale}>
            <FiFileText size={18} />
            <span className="hidden sm:inline">{t("resume")}</span>
          </NavLink>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {hasFinanceSession && <FinanceNotificationBell />}
          <ThemeToggle />
          <UserMenu locale={locale} isLoggedIn={hasFinanceSession} appVersion={appVersion} />
        </div>
      </div>
    </nav>
  );
}
