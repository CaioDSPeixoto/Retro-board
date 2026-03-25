import RoomClient from "@/components/RoomClient";
import { canExport, getCurrentUserPlan } from "@/lib/auth/plan-check";
import { getTranslations } from "next-intl/server";

type RoomPageProps = {
  params: Promise<{
    locale: string;
    id: string | string[];
  }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { locale, id } = await params;

  const roomId = Array.isArray(id) ? id[0] : id;

  if (!roomId) {
    const t = await getTranslations({ locale, namespace: "Room" });
    return <p>{t("roomNotFound")}</p>;
  }

  const exportEnabled = await canExport();
  const userPlan = await getCurrentUserPlan();

  return <RoomClient roomId={roomId} locale={locale} exportEnabled={exportEnabled} userPlan={userPlan} />;
}