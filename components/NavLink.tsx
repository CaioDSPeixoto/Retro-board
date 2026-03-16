"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  locale: string;
  exact?: boolean;
  children: React.ReactNode;
};

export default function NavLink({ href, locale, exact = false, children }: Props) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href || pathname === `/${locale}`
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {children}
    </Link>
  );
}
