import Link from "next/link";
import { getTranslations } from "next-intl/server";

type ResumeItem = {
  title: string;
  subtitle?: string;
  period?: string;
  bullets?: string[];
};

type Header = {
  name: string;
  role: string;
  location: string;
  phone?: string;
  recado?: string;
  email?: string;
  linkedin?: string;
};

type Objective = {
  title: string;
  body: string;
};

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value?: string;
  href?: string;
}) {
  if (!value) return null;

  const content = href ? (
    <a href={href} className="text-blue-600 hover:underline break-words" target="_blank">
      {value}
    </a>
  ) : (
    <span className="break-words">{value}</span>
  );

  return (
    <p className="text-sm text-gray-700">
      <span className="font-semibold text-gray-900">{label}:</span>{" "}
      {content}
    </p>
  );
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Resume");

  const header = t.raw("header") as Header;
  const objective = t.raw("objective") as Objective;

  const experience = (t.raw("experience") as ResumeItem[]) ?? [];
  const education = (t.raw("education") as ResumeItem[]) ?? [];
  const courses = (t.raw("courses") as string[]) ?? [];
  const extra = (t.raw("extra") as string[]) ?? [];

  const hasContactInfo =
    !!header.phone || !!header.recado || !!header.email || !!header.linkedin;

  const linkedinHref =
    header.linkedin &&
    (header.linkedin.startsWith("http")
      ? header.linkedin
      : `https://www.linkedin.com/in/${header.linkedin}`);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <section className="bg-white/90 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
              {header.name}
            </h1>
            {header.role && (
              <p className="text-blue-700 mt-1 font-semibold">
                {header.role}
              </p>
            )}
            {header.location && (
              <p className="text-gray-500 mt-1 text-sm">
                {header.location}
              </p>
            )}
          </div>

          {hasContactInfo && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 space-y-1 min-w-[220px]">
              <ContactRow
                label={t("labels.phone")}
                value={header.phone}
                href={header.phone ? `tel:${header.phone}` : undefined}
              />
              <ContactRow
                label={t("labels.recado")}
                value={header.recado}
              />
              <ContactRow
                label={t("labels.email")}
                value={header.email}
                href={header.email ? `mailto:${header.email}` : undefined}
              />
              <ContactRow
                label={t("labels.linkedin")}
                value={header.linkedin}
                href={linkedinHref}
              />
            </div>
          )}
        </div>

        {/* Objetivo profissional */}
        {objective?.title && objective?.body && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <h2 className="text-lg font-bold text-gray-900">
              {objective.title}
            </h2>
            <p className="text-gray-700 mt-2 leading-relaxed">
              {objective.body}
            </p>
          </div>
        )}

        {/* Experiência */}
        {experience.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-extrabold text-gray-900">
              {t("sections.experience")}
            </h2>
            <div className="mt-4 space-y-4">
              {experience.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-900">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-sm text-gray-600">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {item.period && (
                      <p className="text-xs text-gray-500 font-semibold">
                        {item.period}
                      </p>
                    )}
                  </div>

                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1.5 leading-relaxed">
                      {item.bullets.map((bullet, bulletIndex) => (
                        <li key={`${item.title}-${bulletIndex}`}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Educação + Cursos */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {education.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-gray-900">
                {t("sections.education")}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                {education.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="border-l-4 border-blue-500/70 pl-3"
                  >
                    <p className="font-semibold text-gray-900">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-gray-600">{item.subtitle}</p>
                    )}
                    {item.period && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.period}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {courses.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-gray-900">
                {t("sections.courses")}
              </h2>
              <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1.5">
                {courses.map((course, index) => (
                  <li key={`${course}-${index}`}>{course}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Extra */}
        {extra.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">
              {t("sections.extra")}
            </h2>
            <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1.5">
              {extra.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ações */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/caio-peixoto-cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-900 transition shadow-md shadow-blue-200 active:scale-95"
          >
            ↓ {t("download")}
          </a>
        </div>
      </section>
    </div>
  );
}