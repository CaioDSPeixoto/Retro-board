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

function ContactRow({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null;
  const content = href ? (
    <a href={href} className="text-blue-500 hover:underline break-words" target="_blank">
      {value}
    </a>
  ) : (
    <span className="break-words">{value}</span>
  );
  return (
    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
      <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}:</span>{" "}
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

  const hasContactInfo = !!header.phone || !!header.recado || !!header.email || !!header.linkedin;
  const linkedinHref =
    header.linkedin &&
    (header.linkedin.startsWith("http")
      ? header.linkedin
      : `https://www.linkedin.com/in/${header.linkedin}`);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <section
        className="rounded-3xl border p-6 sm:p-8 shadow-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight heading-gradient">
              {header.name}
            </h1>
            {header.role && (
              <p className="mt-1 font-semibold" style={{ color: "var(--color-accent-text)" }}>
                {header.role}
              </p>
            )}
            {header.location && (
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                {header.location}
              </p>
            )}
          </div>

          {hasContactInfo && (
            <div
              className="rounded-2xl border px-4 py-3 space-y-1 min-w-[220px]"
              style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
            >
              <ContactRow label={t("labels.phone")} value={header.phone} href={header.phone ? `tel:${header.phone}` : undefined} />
              <ContactRow label={t("labels.recado")} value={header.recado} />
              <ContactRow label={t("labels.email")} value={header.email} href={header.email ? `mailto:${header.email}` : undefined} />
              <ContactRow label={t("labels.linkedin")} value={header.linkedin} href={linkedinHref} />
            </div>
          )}
        </div>

        {/* Objetivo */}
        {objective?.title && objective?.body && (
          <div
            className="mt-6 rounded-2xl border p-5"
            style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              {objective.title}
            </h2>
            <p className="mt-2 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {objective.body}
            </p>
          </div>
        )}

        {/* Experiência */}
        {experience.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
              {t("sections.experience")}
            </h2>
            <div className="mt-4 space-y-4">
              {experience.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="rounded-2xl border p-5"
                  style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {item.period && (
                      <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                        {item.period}
                      </p>
                    )}
                  </div>
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="mt-3 list-disc list-inside text-sm space-y-1.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {item.bullets.map((bullet, bulletIndex) => (
                        <li key={`${item.title}-${bulletIndex}`}>{bullet}</li>
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
            <div
              className="rounded-2xl border p-5"
              style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                {t("sections.education")}
              </h2>
              <div className="mt-3 space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {education.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border-l-4 border-blue-500/70 pl-3">
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                    {item.subtitle && <p>{item.subtitle}</p>}
                    {item.period && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.period}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {courses.length > 0 && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                {t("sections.courses")}
              </h2>
              <ul className="mt-3 list-disc list-inside text-sm space-y-1.5" style={{ color: "var(--color-text-secondary)" }}>
                {courses.map((course, index) => (
                  <li key={`${course}-${index}`}>{course}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Extra */}
        {extra.length > 0 && (
          <div
            className="mt-6 rounded-2xl border p-5"
            style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              {t("sections.extra")}
            </h2>
            <ul className="mt-3 list-disc list-inside text-sm space-y-1.5" style={{ color: "var(--color-text-secondary)" }}>
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
