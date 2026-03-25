"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export default function NavigationProgress({ label }: { label?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const currentUrl = useRef("");

  // Atualiza a URL de referência e esconde o overlay quando a navegação conclui
  useEffect(() => {
    currentUrl.current = pathname + (searchParams?.toString() || "");
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignora links externos, âncoras, downloads e target=_blank
      if (
        href.startsWith("http") ||
        href.startsWith("mailto") ||
        href.startsWith("tel") ||
        href.startsWith("#") ||
        target.getAttribute("target") === "_blank" ||
        target.hasAttribute("download")
      ) return;

      // Se o link aponta para a mesma URL atual, não mostra spinner
      try {
        const linkUrl = new URL(href, window.location.origin);
        const linkPath = linkUrl.pathname + linkUrl.search;
        if (linkPath === currentUrl.current) return;
      } catch {
        // Se não conseguir parsear, deixa seguir normalmente
      }

      setLoading(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading) return null;

  return <LoadingOverlay fullScreen label={label} />;
}
