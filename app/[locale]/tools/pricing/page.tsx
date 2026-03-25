import { getTranslations } from "next-intl/server";
import { FiCheck, FiX } from "react-icons/fi";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Pricing");

  const plans = [
    {
      name: t("freeName"),
      price: t("freePrice"),
      features: [
        { label: t("freeBoards"), included: true },
        { label: t("freeTodos"), included: true },
        { label: t("freeTimeTracker"), included: true },
        { label: t("freeRetro"), included: true },
        { label: t("freeExport"), included: false },
        { label: t("freeCloudSync"), included: false },
        { label: t("freeReports"), included: false },
      ],
    },
    {
      name: t("proName"),
      price: t("proPrice"),
      highlight: true,
      features: [
        { label: t("proBoards"), included: true },
        { label: t("proTodos"), included: true },
        { label: t("proTimeTracker"), included: true },
        { label: t("proRetro"), included: true },
        { label: t("proExport"), included: true },
        { label: t("proCloudSync"), included: true },
        { label: t("proReports"), included: true },
      ],
    },
    {
      name: t("teamName"),
      price: t("teamPrice"),
      features: [
        { label: t("teamBoards"), included: true },
        { label: t("teamTodos"), included: true },
        { label: t("teamTimeTracker"), included: true },
        { label: t("teamRetro"), included: true },
        { label: t("teamExport"), included: true },
        { label: t("teamCloudSync"), included: true },
        { label: t("teamReports"), included: true },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold heading-gradient">{t("title")}</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
              plan.highlight
                ? "border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]"
                : "border-[var(--color-border)] shadow-sm"
            }`}
            style={{ background: "var(--color-surface)" }}
          >
            {plan.highlight && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">
                {t("recommended")}
              </span>
            )}
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {plan.name}
            </h2>
            <p className="text-2xl font-extrabold mt-2" style={{ color: "var(--color-accent-text)" }}>
              {plan.price}
            </p>

            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-sm">
                  {f.included ? (
                    <FiCheck className="text-green-500 shrink-0 mt-0.5" size={16} />
                  ) : (
                    <FiX className="text-red-400 shrink-0 mt-0.5" size={16} />
                  )}
                  <span style={{ color: f.included ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <button
              className={`mt-6 w-full py-3 font-bold rounded-xl transition-all active:scale-[0.98] ${
                plan.highlight
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                  : "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
              }`}
            >
              {t("selectPlan")}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs mt-8" style={{ color: "var(--color-text-muted)" }}>
        {t("disclaimer")}
      </p>
    </div>
  );
}
