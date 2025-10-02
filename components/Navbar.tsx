"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { FiHome ,FiInfo } from "react-icons/fi";
import SelectLanguage from "./SelectLanguage";
import { useTranslations } from "next-intl";
const appVersion = process.env.APP_VERSION || "v0.0.0";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const params = useParams();
  const locale = params?.locale || "pt";

  return (
    <nav className="px-4 py-3 text-base text-gray-700 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900">
          <FiHome size={18} />
          <span className="font-medium">{t("home")}</span>
        </Link>

        <div className="flex items-center gap-4 text-gray-500 text-sm">
        {/* Language Selector */}
        <div className="relative">
          <SelectLanguage />
        </div>

        {/* Divider */}
        <span className="h-4 w-px bg-gray-300"></span>

        {/* Version Info */}
        <Link
          href={`/${locale}/releases`}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
          title={t("versionTitle", { version: appVersion })}
        >
          <FiInfo
            size={16}
            className="cursor-help text-blue-500 hover:text-blue-600 transition-colors"
          />
          <span className="hidden sm:inline">v{appVersion}</span>
        </Link>
      </div>

      </div>
    </nav>
  );
}