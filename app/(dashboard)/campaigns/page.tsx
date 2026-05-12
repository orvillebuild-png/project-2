import { ModulePage } from "@/components/layout/ModulePage";

export default function CampaignsPage() {
  return (
    <ModulePage
      ctaHref="/campaigns/new"
      ctaLabel="New campaign"
      description="Segment contacts, choose templates and cards, then send or schedule invitation campaigns."
      eyebrow="Invitations"
      rows={[
        { label: "Recipient filters", status: "Phase 5", tone: "amber" },
        { label: "Send fan-out jobs", status: "Phase 5", tone: "amber" },
        { label: "Open and click tracking", status: "Phase 5", tone: "amber" },
        { label: "Reminder emails", status: "Phase 5", tone: "amber" }
      ]}
      title="Campaigns"
    />
  );
}
