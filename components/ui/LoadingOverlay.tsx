"use client";

import Spinner from "./Spinner";

type Props = {
  label?: string;
  fullScreen?: boolean;
};

export default function LoadingOverlay({ label, fullScreen = false }: Props) {
  const base = fullScreen
    ? "fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-auto"
    : "absolute inset-0 backdrop-blur-[1px] flex items-center justify-center z-[9999] rounded-inherit pointer-events-auto";

  return (
    <div className={base} style={{ background: "rgba(0,0,0,0.25)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <Spinner size="md" color="blue" />
        {label && <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</span>}
      </div>
    </div>
  );
}
