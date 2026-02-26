import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Home");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <section className="rounded-3xl bg-white/90 border border-blue-100 shadow-xl p-8 md:p-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-3">
          {t("title")}
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mt-3">
          {t("subtitle")}
        </p>
        <p className="text-gray-600 mt-4">{t("description")}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/tools`}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            {t("ctaTools")}
          </Link>
          <Link
            href={`/${locale}/tools/retroboard`}
            className="px-5 py-3 rounded-xl bg-white text-blue-600 border border-blue-200 font-semibold hover:bg-blue-50 transition"
          >
            {t("ctaRetroboard")}
          </Link>
          <Link
            href={`/${locale}/cv`}
            className="px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
          >
            {t("ctaResume")}
          </Link>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {t("aboutTitle")}
          </h2>
          <p className="text-gray-600 mt-3">{t("aboutBody")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {t("highlightsTitle")}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-sm font-semibold text-gray-800">
                {t("highlight1Title")}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t("highlight1Desc")}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-sm font-semibold text-gray-800">
                {t("highlight2Title")}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t("highlight2Desc")}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-sm font-semibold text-gray-800">
                {t("highlight3Title")}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t("highlight3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">
          {t("contactTitle")}
        </h2>
        <p className="text-gray-600 mt-3">{t("contactBody")}</p>
        <div className="mt-4">
          <Link
            href={`/${locale}/tools`}
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition"
          >
            {t("contactButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
