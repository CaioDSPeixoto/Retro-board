"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { requestJoinByCode } from "@/app/[locale]/tools/finance/(protected)/invite-actions";
import Spinner from "@/components/ui/Spinner";

type Props = { locale: string };

export default function FinanceJoinByCode({ locale }: Props) {
  const t = useTranslations("FinancePage");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setFeedback(null);
    setError(null);

    const res = await requestJoinByCode(trimmed, locale);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
    } else {
      setFeedback(t("joinRequestSent"));
      setCode("");
    }

    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
            {t("joinByCodeLabel")}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("joinByCodePlaceholder")}
            className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none"
            style={{
              background: "var(--color-surface-raised)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full md:w-auto px-6 py-3 bg-[var(--color-accent-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-accent-hover)] active:scale-95 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2 md:mt-0 flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" color="white" />}
            {loading ? t("sending") : t("joinByCodeButton")}
          </button>
        </div>
      </form>

      {feedback && <p className="mt-2 text-xs finance-success-text">{feedback}</p>}
      {error && <p className="mt-2 text-xs finance-danger-text">{error}</p>}
    </div>
  );
}
