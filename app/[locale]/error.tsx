"use client";

import { useTranslations } from "next-intl";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: Props) {
  const t = useTranslations("Common");

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div
        className="max-w-md w-full rounded-2xl border shadow-lg p-8 text-center space-y-4"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <FiAlertTriangle className="text-red-600" size={28} />
        </div>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("errorTitle")}
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t("errorDescription")}
        </p>
        {error.digest && (
          <p
            className="text-xs font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw size={16} />
            {t("errorRetry")}
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            <FiHome size={16} />
            {t("errorGoHome")}
          </a>
        </div>
      </div>
    </div>
  );
}
