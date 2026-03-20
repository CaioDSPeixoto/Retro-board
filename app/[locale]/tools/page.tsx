import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiDollarSign, FiList, FiUsers, FiWatch, FiTool } from "react-icons/fi";

export default async function ToolsPage() {
  const t = await getTranslations("Tools");

  const tools = [
    {
      href: "tools/time-tracker",
      icon: <FiWatch size={28} />,
      title: t("timeTrackerTitle"),
      desc: t("timeTrackerDesc"),
      active: true,
    },
    {
      href: "tools/todo",
      icon: <FiList size={28} />,
      title: t("todoListTitle"),
      desc: t("todoListDesc"),
      active: true,
    },
    {
      href: "tools/finance",
      icon: <FiDollarSign size={28} />,
      title: t("financeTitle"),
      desc: t("financeDesc"),
      active: true,
    },
    {
      href: "tools/retroboard",
      icon: <FiUsers size={28} />,
      title: t("retroboardTitle"),
      desc: t("retroboardDesc"),
      active: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-2 heading-gradient">
        {t("title")}
      </h1>
      <p className="mb-8" style={{ color: "var(--color-text-secondary)" }}>{t("description")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group border p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex items-center gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div
              className="p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shrink-0"
              style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent-text)" }}
            >
              {tool.icon}
            </div>
            <div className="min-w-0">
              <h2
                className="font-semibold group-hover:text-blue-500 transition-colors"
                style={{ color: "var(--color-text-primary)" }}
              >
                {tool.title}
              </h2>
              <p className="text-sm mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{tool.desc}</p>
            </div>
          </Link>
        ))}

        {/* Em breve */}
        <div className="bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] p-5 rounded-2xl flex items-center gap-4 opacity-50 cursor-not-allowed select-none">
          <div className="p-3 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] shrink-0">
            <FiTool size={28} />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--color-text-muted)]">{t("toolSoon")}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{t("toolSoonDesc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
