import { EventDetail } from "@/components/EventDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  return (
    <main>
      <EventDetail eventId={id} />
    </main>
  );
}
