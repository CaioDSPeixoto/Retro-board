import TimeTracker from "@/components/TimeTracker";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getTimeTrackerData, getTimeTrackerDates } from "@/app/[locale]/tools/time-tracker/actions";
import type { TimeTrackerData } from "@/types/time-tracker";

export default async function TimeTrackerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("TimeTracker");
  const session = await getSession();

  let initialData: TimeTrackerData | null = null;
  let initialDates: string[] = [];

  if (session) {
    const result = await getTimeTrackerData(locale);
    if ("data" in result) {
      initialData = result.data;
    }
    const datesResult = await getTimeTrackerDates(locale);
    if ("dates" in datesResult) {
      initialDates = datesResult.dates;
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fadeIn min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6">
        <span className="heading-gradient">
          {t("title")}
        </span>
      </h1>
      <TimeTracker
        initialData={initialData}
        initialDates={initialDates}
        isLoggedIn={!!session}
        locale={locale}
      />
    </div>
  );
}
