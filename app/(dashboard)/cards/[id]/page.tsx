import { notFound } from "next/navigation";
import { CardDesigner } from "@/components/cards/CardDesigner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCard, updateCard } from "@/lib/cards";

export default async function CardDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const [{ created, error, saved }, card] = await Promise.all([searchParams, getCard(id)]);

  if (!card) {
    notFound();
  }

  return (
    <>
      <PageHeader
        action={<Button href="/cards" variant="secondary">Back to cards</Button>}
        description="Edit size, design direction, and individual layers."
        eyebrow="Designer"
        title={card.name}
      />
      <CardDesigner
        action={updateCard.bind(null, card.id)}
        cardData={card.canvas_data}
        cardName={card.name}
        error={error}
        notice={created ? "Card created." : saved ? "Card saved." : undefined}
      />
    </>
  );
}
