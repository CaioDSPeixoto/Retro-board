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
      <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
        {t("title")}
      </h1>
      <p className="text-gray-600 mb-8">{t("description")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group bg-white border border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shrink-0">
              {tool.icon}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {tool.title}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{tool.desc}</p>
            </div>
          </Link>
        ))}

        {/* Em breve */}
        <div className="bg-white/60 border border-dashed border-gray-300 p-5 rounded-2xl flex items-center gap-4 opacity-60 cursor-not-allowed">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-400 shrink-0">
            <FiTool size={28} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-500">{t("toolSoon")}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{t("toolSoonDesc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
