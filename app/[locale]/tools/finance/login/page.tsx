import LoginForm from "@/components/login/LoginForm";
import { getTranslations } from "next-intl/server";

export default async function FinanceLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("FinanceLogin");

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div
        className="p-8 rounded-2xl shadow-xl w-full max-w-sm border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold heading-gradient mb-2">
            {t("title")}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t("description")}
          </p>
        </div>
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
