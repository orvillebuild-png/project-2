import { Image as ImageIcon } from "lucide-react";
import { CardPreview } from "@/components/cards/CardPreview";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { listCards } from "@/lib/cards";

export default async function CardsPage() {
  const cards = await listCards();

  return (
    <>
      <PageHeader
        action={<Button href="/cards/new">New card</Button>}
        description="Create flexible invitation card designs that can later be attached to campaigns."
        eyebrow="Designer"
        title="Cards"
      />
      <Card>
        <CardHeader
          description={`${cards.length} saved card${cards.length === 1 ? "" : "s"} in this workspace`}
          title="Invitation cards"
        />
        {cards.length > 0 ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <a
                className="group rounded-lg border border-line bg-field p-4 transition hover:border-moss hover:bg-white"
                href={`/cards/${card.id}`}
                key={card.id}
              >
                <div className="flex h-64 items-center justify-center overflow-hidden rounded-md border border-line bg-white p-3">
                  <CardPreview data={card.canvas_data} scale={Math.min(0.18, 230 / card.canvas_data.width, 210 / card.canvas_data.height)} />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink group-hover:text-moss">{card.name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {card.canvas_data.width} x {card.canvas_data.height}px
                    </p>
                  </div>
                  <ImageIcon className="h-5 w-5 text-moss" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              actionLabel="Create first card"
              description="Start with a preset, change the size, then layer text and shapes into a reusable invitation card."
              href="/cards/new"
              title="No cards yet"
            />
          </div>
        )}
      </Card>
    </>
  );
}
