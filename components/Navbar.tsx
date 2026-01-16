import Link from "next/link";
import { FiHome, FiTool } from "react-icons/fi";
import UserMenu from "./UserMenu";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import packageInfo from '../package.json';

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navbar");
  const session = await getSession();

  const appVersion = packageInfo.version || "0.0.0";

  return (
    <nav className="px-4 py-3 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* LEFT */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <FiHome size={18} />
            <span className="hidden sm:inline">{t("home")}</span>
          </Link>

          <Link
            href={`/${locale}/tools`}
            className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <FiTool size={18} />
            <span className="hidden sm:inline">{t("tools")}</span>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center">
          <UserMenu locale={locale} isLoggedIn={!!session} appVersion={appVersion} />
        </div>
      </div>
    </nav>
  );
}
