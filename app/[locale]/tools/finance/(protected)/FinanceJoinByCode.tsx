"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { requestJoinByCode } from "./invite-actions";

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
    <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-4">
      <h2 className="text-base font-semibold text-gray-800 mb-2">
        {t("joinByCodeTitle")}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("joinByCodeLabel")}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("joinByCodePlaceholder")}
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2 md:mt-0"
          >
            {loading ? t("sending") : t("joinByCodeButton")}
          </button>
        </div>
      </form>

      {feedback && <p className="mt-2 text-xs text-green-600">{feedback}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
