"use client";

import Spinner from "./Spinner";

type Props = {
  label?: string;
  fullScreen?: boolean;
};

export default function LoadingOverlay({ label, fullScreen = false }: Props) {
  const base = fullScreen
    ? "fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-auto"
    : "absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-[9999] rounded-inherit pointer-events-auto";

  return (
    <div className={base}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
        <Spinner size="md" color="blue" />
        {label && <span className="text-sm font-semibold text-gray-700">{label}</span>}
      </div>
    </div>
  );
}
