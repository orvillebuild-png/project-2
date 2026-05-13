import { MailPlus } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { listCampaigns } from "@/lib/campaigns";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();

  return (
    <>
      <PageHeader
        action={<Button href="/campaigns/new"><MailPlus className="h-4 w-4" />Campaign</Button>}
        description="Draft event invitations, preview merge fields, and prepare RSVP recipient logs before sending is connected."
        eyebrow="Invitations"
        title="Campaigns"
      />
      <Card>
        <CardHeader
          description={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} in this workspace`}
          title="Campaign drafts"
        />
        <div className="p-5">
          {campaigns.length > 0 ? (
            <div className="grid gap-3">
              {campaigns.map((campaign) => (
                <div className="flex flex-col gap-3 rounded-lg border border-line bg-field p-4 md:flex-row md:items-center md:justify-between" key={campaign.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-ink">{campaign.name ?? campaign.email_templates?.name ?? "Untitled campaign"}</h2>
                      <Badge tone={campaign.status === "draft" ? "amber" : "green"}>{campaign.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {campaign.email_templates?.subject ?? "No subject"} - {campaign.events?.title ?? "No event"} - {campaign.recipient_count} recipient{campaign.recipient_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button href={`/campaigns/${campaign.id}`} variant="secondary">Open</Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              actionLabel="Create campaign"
              description="Start with an event that has selected invitees. The first version saves drafts and prepares pending RSVP records without sending email."
              href="/campaigns/new"
              title="No campaigns yet"
            />
          )}
        </div>
      </Card>
    </>
  );
}
