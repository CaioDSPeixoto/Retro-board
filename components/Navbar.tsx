import Link from "next/link";
import { FiHome, FiTool } from "react-icons/fi";
import SelectLanguage from "./SelectLanguage";
import UserMenu from "./UserMenu";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navbar");
  const session = await getSession();

  return (
    <nav className="px-4 py-3 text-base text-gray-700 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium hover:text-gray-900 transition-colors"
          >
            <FiHome size={18} />
            {t("home")}
          </Link>

          <Link
            href={`/${locale}/tools`}
            className="flex items-center gap-2 font-medium hover:text-gray-900 transition-colors"
          >
            <FiTool size={18} />
            {t("tools")}
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <SelectLanguage />

          {session && (
            <>
              <span className="h-4 w-px bg-gray-300" />
              <UserMenu locale={locale} />
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
