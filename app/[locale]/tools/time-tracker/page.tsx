import TimeTracker from "@/components/TimeTracker";
import { useTranslations } from "next-intl";

export default function TimeTrackerPage() {
  const t = useTranslations("TimeTracker");

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fadeIn min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-600 mb-6">
        <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
          {t("title")}
        </span>
      </h1>
      <TimeTracker />
    </div>
  );
}
