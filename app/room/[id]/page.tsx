import RoomClient from "./RoomClient";

type RoomPageProps = {
  params: { id: string | string[] };
};

export default async function RoomPage({ params }: RoomPageProps) {
  const awaitedParams = await params; // aqui você “await” antes de acessar
  const roomId = Array.isArray(awaitedParams.id) ? awaitedParams.id[0] : awaitedParams.id;
  if (!roomId) return <p>ID da sala não encontrado</p>;

  return <RoomClient roomId={roomId} />;
}
