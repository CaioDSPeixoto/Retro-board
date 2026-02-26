import Link from "next/link";
import { getTranslations } from "next-intl/server";

type ResumeItem = {
  title: string;
  subtitle?: string;
  period?: string;
  bullets?: string[];
};

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Resume");

  const header = t.raw("header") as {
    name: string;
    role: string;
    location: string;
    phone: string;
    recado: string;
    email: string;
    linkedin: string;
  };

  const objective = t.raw("objective") as { title: string; body: string };
  const experience = t.raw("experience") as ResumeItem[];
  const education = t.raw("education") as ResumeItem[];
  const courses = t.raw("courses") as string[];
  const extra = t.raw("extra") as string[];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              {header.name}
            </h1>
            <p className="text-gray-600 mt-1 font-semibold">{header.role}</p>
            <p className="text-gray-500 mt-1">{header.location}</p>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-semibold">{t("labels.phone")}:</span>{" "}
              {header.phone}
            </p>
            <p>
              <span className="font-semibold">{t("labels.recado")}:</span>{" "}
              {header.recado}
            </p>
            <p>
              <span className="font-semibold">{t("labels.email")}:</span>{" "}
              {header.email}
            </p>
            <p>
              <span className="font-semibold">{t("labels.linkedin")}:</span>{" "}
              {header.linkedin}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <h2 className="text-lg font-bold text-gray-900">
            {objective.title}
          </h2>
          <p className="text-gray-700 mt-2">{objective.body}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-extrabold text-gray-900">
            {t("sections.experience")}
          </h2>
          <div className="mt-4 space-y-4">
            {experience.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-2xl border border-gray-200 p-5 bg-white"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <div>
                    <p className="text-base font-bold text-gray-900">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-sm text-gray-600">{item.subtitle}</p>
                    )}
                  </div>
                  {item.period && (
                    <p className="text-xs text-gray-500 font-semibold">
                      {item.period}
                    </p>
                  )}
                </div>
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1">
                    {item.bullets.map((bullet, bulletIndex) => (
                      <li key={`${item.title}-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 p-5 bg-white">
            <h2 className="text-lg font-bold text-gray-900">
              {t("sections.education")}
            </h2>
            <div className="mt-3 space-y-3 text-sm text-gray-700">
              {education.map((item, index) => (
                <div key={`${item.title}-${index}`}>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-gray-600">{item.subtitle}</p>
                  )}
                  {item.period && (
                    <p className="text-xs text-gray-500">{item.period}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-5 bg-white">
            <h2 className="text-lg font-bold text-gray-900">
              {t("sections.courses")}
            </h2>
            <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1">
              {courses.map((course, index) => (
                <li key={`${course}-${index}`}>{course}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 p-5 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {t("sections.extra")}
          </h2>
          <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1">
            {extra.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/caio-peixoto-cv.pdf"
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
          >
            {t("download")}
          </a>
          <Link
            href={`/${locale}/tools`}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {t("backToTools")}
          </Link>
        </div>
      </section>
    </div>
  );
}
