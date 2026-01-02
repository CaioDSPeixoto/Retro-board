type Props = {
  params: { id: string };
};

export default function GroupPage({ params }: Props) {
  return <div className="p-6">Grupo: {params.id}</div>;
}