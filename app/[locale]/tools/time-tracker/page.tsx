import TimeTracker from "@/components/TimeTracker";
import { useTranslations } from "next-intl";

export default function TimeTrackerPage() {
  const t = useTranslations("TimeTracker");

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fadeIn min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6">
        <span className="heading-gradient">
          {t("title")}
        </span>
      </h1>
      <TimeTracker />
    </div>
  );
}
