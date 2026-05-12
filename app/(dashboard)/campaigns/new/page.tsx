import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

const steps = ["Select event", "Filter contacts", "Choose template", "Schedule or send"];

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader description="This will become the multi-step campaign builder for event invitations." eyebrow="Campaigns" title="New campaign" />
      <Card className="max-w-4xl p-5">
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <div className="rounded-md border border-line bg-field p-4" key={step}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Step {index + 1}</p>
              <p className="mt-2 text-sm font-semibold text-ink">{step}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
