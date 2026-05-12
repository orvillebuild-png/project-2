import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        description="Usage stays in our database first, then is reported to Lemon Squeezy as the launch Merchant of Record."
        eyebrow="Billing"
        title="Lemon Squeezy billing"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader action={<Badge tone="amber">Not connected</Badge>} description="Current period usage will be calculated from local usage events." title="Usage summary" />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            <div className="rounded-md border border-line bg-field p-4">
              <p className="text-sm text-muted">Emails sent</p>
              <p className="mt-2 text-3xl font-semibold text-ink">0</p>
            </div>
            <div className="rounded-md border border-line bg-field p-4">
              <p className="text-sm text-muted">Validations run</p>
              <p className="mt-2 text-3xl font-semibold text-ink">0</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Hosted billing</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Checkout and subscription management links will point to Lemon Squeezy after API keys and product variants are configured.
          </p>
          <Button className="mt-5 w-full" type="button">Connect billing</Button>
        </Card>
      </div>
    </>
  );
}
