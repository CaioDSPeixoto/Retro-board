// app/[locale]/room/[id]/page.tsx
import RoomClient from "./RoomClient";

type RoomPageProps = {
  params: { id: string | string[] };
};

export default async function RoomPage({ params }: RoomPageProps) {
  // await params antes de acessar
  const awaitedParams = await params;
  const roomId = Array.isArray(awaitedParams.id) ? awaitedParams.id[0] : awaitedParams.id;

  if (!roomId) return <p>Room's ID not found.</p>;

  return <RoomClient roomId={roomId} />;
}
