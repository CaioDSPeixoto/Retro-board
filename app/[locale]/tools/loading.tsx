import { getTranslations } from "next-intl/server";

export default async function ToolsLoading() {
  const t = await getTranslations("Common");

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-700">
          {t("loading")}
        </span>
      </div>
    </div>
  );
}
