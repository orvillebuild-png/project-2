import { CardDesigner } from "@/components/cards/CardDesigner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { createCard, getCardOrgId, newCardDefaults } from "@/lib/cards";

export default async function NewCardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, orgId] = await Promise.all([searchParams, getCardOrgId()]);

  return (
    <>
      <PageHeader
        action={<Button href="/cards" variant="secondary">Back to cards</Button>}
        description="Choose a size, apply a design direction, and build a layered invitation card."
        eyebrow="Designer"
        title="New card"
      />
      <CardDesigner
        action={createCard}
        cardData={newCardDefaults()}
        cardName="Untitled invitation"
        error={error}
        orgId={orgId}
      />
    </>
  );
}
