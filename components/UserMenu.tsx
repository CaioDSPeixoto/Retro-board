"use client";

import { useState } from "react";
import { FiChevronDown, FiLogOut, FiInfo } from "react-icons/fi";
import { logoutFinance } from "@/app/[locale]/tools/finance/login/actions";
import { useTranslations } from "next-intl";
import Link from "next/link";

type UserMenuProps = {
  locale: string;
};

export default function UserMenu({ locale }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("UserMenu");
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";

  return (
    <div className="relative">
      {/* BOTÃO */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        {t("account")}
        <FiChevronDown size={14} />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border z-50">
          
          <form action={logoutFinance}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition"
            >
              <FiLogOut size={14} />
              {t("logout")}
            </button>
          </form>

          <Link
            href={`/${locale}/releases`}
            className="block border-t hover:bg-gray-50 transition"
            title={t("versionTitle", { version: appVersion })}
          >
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
              <FiInfo size={12} />
              v{appVersion}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
