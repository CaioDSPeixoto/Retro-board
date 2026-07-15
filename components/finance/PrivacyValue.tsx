"use client";

import { useState, useCallback } from "react";
import { usePrivacy } from "./PrivacyProvider";

type Props = {
  children: React.ReactNode;
  /** Additional CSS classes for the wrapper span */
  className?: string;
  /** Render as inline-block (default) or block */
  as?: "span" | "div";
};

/**
 * Wraps monetary values with blur when privacy mode is active.
 * - Desktop: hover to reveal
 * - Mobile: tap to reveal, tap again to hide
 */
export default function PrivacyValue({ children, className = "", as: Tag = "span" }: Props) {
  const { privacyEnabled } = usePrivacy();
  const [revealed, setRevealed] = useState(false);

  const handleClick = useCallback(() => {
    if (!privacyEnabled) return;
    setRevealed((prev) => !prev);
  }, [privacyEnabled]);

  if (!privacyEnabled) {
    return <Tag className={className}>{children}</Tag>;
  }

  const isBlurred = !revealed;

  return (
    <Tag
      className={`privacy-value ${isBlurred ? "privacy-blurred" : "privacy-revealed"} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      role="button"
      tabIndex={0}
      aria-label={isBlurred ? "Valor oculto. Clique para revelar." : "Valor visível. Clique para ocultar."}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </Tag>
  );
}
