import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getCampaign, getCampaignPreview } from "@/lib/campaigns";

export default async function CampaignFullPreviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaign, preview] = await Promise.all([getCampaign(id), getCampaignPreview(id)]);

  if (!campaign || !preview) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-night p-5 text-white shadow-lift sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-amber">Full email preview</p>
          <h1 className="mt-2 text-2xl font-semibold">{campaign.name ?? campaign.email_templates?.name}</h1>
          <p className="mt-1 text-sm text-white/62">Rendered from the same HTML used by Resend sends.</p>
        </div>
        <Button href={`/campaigns/${id}`} variant="secondary">Back to editor</Button>
      </section>

      <div className="rounded-[1.5rem] border border-line bg-white p-3 shadow-soft">
        <iframe
          className="h-[calc(100vh-13rem)] min-h-[620px] w-full rounded-[1.1rem] border border-line bg-white"
          src={`/campaigns/${id}/email-preview`}
          title="Full email preview"
        />
      </div>
    </div>
  );
}
