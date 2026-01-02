import Link from "next/link";
import { useTranslations } from "next-intl";
import { FiDollarSign, FiList, FiUsers, FiWatch } from "react-icons/fi";

export default function ToolsPage() {
  const t = useTranslations("Tools");

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-extrabold text-blue-600 mb-6">
        <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
          {t("title")}
        </span>
      </h1>

      <p className="text-gray-700 mb-8">{t("description")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* TimeTracker */}

        <Link
          href="tools/time-tracker"
          className="border border-blue-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition bg-white flex items-center gap-3"
        >
          <FiWatch  size={28} className="text-blue-700" />
          <div>
            <h2 className="font-semibold text-lg text-gray-800">
              {t("timeTrackerTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("timeTrackerDesc")}
            </p>
          </div>
        </Link>

        {/* Todo */}
        <Link
            href="tools/todo"
            className="border border-blue-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition bg-white flex items-center gap-3"
            >
            <FiList size={28} className="text-blue-700" />
            <div>
                <h2 className="font-semibold text-lg text-gray-800">
                {t("todoListTitle")}
                </h2>
                <p className="text-sm text-gray-600">
                {t("todoListDesc")}
                </p>
            </div>
        </Link>

        {/* Finance */}
        <Link
            href="tools/finance"
            className="border border-blue-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition bg-white flex items-center gap-3"
            >
            <FiDollarSign size={28} className="text-blue-700" />
            <div>
                <h2 className="font-semibold text-lg text-gray-800">
                {t("financeTitle")}
                </h2>
                <p className="text-sm text-gray-600">
                {t("financeDesc")}
                </p>
            </div>
        </Link>

        {/* Chat */}
        <Link
            href="tools"
            className="border border-blue-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition bg-white flex items-center gap-3"
            >
            <FiUsers size={28} className="text-blue-700" />
            <div>
                <h2 className="font-semibold text-lg text-gray-800">
                {t("toolSoon")}
                </h2>
                <p className="text-sm text-gray-600">
                {t("toolSoon")}
                </p>
            </div>
        </Link>
      </div>
    </div>
  );
}
