import RoomClient from "./RoomClient";

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
    return <p>Room's ID not found.</p>;
  }

  return <RoomClient roomId={roomId} locale={locale} />;
}