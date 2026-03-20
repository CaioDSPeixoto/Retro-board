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
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
      }`}
    >
      {children}
    </Link>
  );
}
