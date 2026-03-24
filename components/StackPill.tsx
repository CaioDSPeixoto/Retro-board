"use client";

import { useState, useCallback, useRef } from "react";

type Props = {
  label: string;
  delay: number;
};

export default function StackPill({ label, delay }: Props) {
  const [clicks, setClicks] = useState(0);
  const [exploding, setExploding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // After initial CSS animation ends, mark as mounted so we control transform
  const handleAnimationEnd = useCallback(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(() => {
    if (exploding) return;

    const next = clicks + 1;

    if (next >= 8) {
      // Explode!
      setExploding(true);
      setClicks(0);
      setTimeout(() => {
        setExploding(false);
      }, 600);
    } else {
      setClicks(next);
    }
  }, [clicks, exploding]);

  // Scale grows with each click
  const scale = mounted ? 1 + clicks * 0.25 : 1;

  return (
    <span
      ref={ref}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      className={`px-3 py-1 text-sm rounded-full border cursor-pointer select-none inline-block ${
        !mounted ? "animate-scaleIn" : ""
      } ${exploding ? "" : "hover:bg-blue-600 hover:text-white hover:border-blue-600"}`}
      style={{
        background: exploding ? "transparent" : "var(--color-surface-raised)",
        borderColor: exploding ? "transparent" : "var(--color-border)",
        color: exploding ? "transparent" : "var(--color-text-secondary)",
        transform: mounted ? `scale(${exploding ? 3 : scale})` : undefined,
        opacity: exploding ? 0 : 1,
        filter: exploding ? "blur(8px)" : "none",
        transition: mounted ? "transform 0.2s ease, opacity 0.4s ease, filter 0.4s ease, background 0.2s, color 0.2s, border-color 0.2s" : undefined,
        animationDelay: !mounted ? `${delay}ms` : undefined,
        zIndex: scale > 1.5 ? 10 : "auto",
        position: "relative",
      }}
    >
      {label}
    </span>
  );
}
