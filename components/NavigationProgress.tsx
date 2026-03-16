"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export default function NavigationProgress({ label }: { label?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // navegação concluída — esconde o overlay
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // ignora links externos, âncoras, downloads e target=_blank
      if (
        href.startsWith("http") ||
        href.startsWith("mailto") ||
        href.startsWith("tel") ||
        href.startsWith("#") ||
        target.getAttribute("target") === "_blank" ||
        target.hasAttribute("download")
      ) return;

      setLoading(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading) return null;

  return <LoadingOverlay fullScreen label={label} />;
}
