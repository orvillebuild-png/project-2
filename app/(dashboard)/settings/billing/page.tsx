import { ArrowUpRight, CheckCircle2, CreditCard, ReceiptText, Send, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getBillingOverview, startBillingCheckout } from "@/lib/billing";

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const [{ checkout, error }, billing] = await Promise.all([searchParams, getBillingOverview()]);
  const statusTone = billing.org.plan_status === "active" || billing.org.plan_status === "trialing" ? "green" : billing.org.plan_status === "past_due" ? "coral" : "amber";

  return (
    <>
      <PageHeader
        description="Usage stays in Project 2 first, then is reported to Lemon Squeezy for global checkout, taxes, invoices, and subscription collection."
        eyebrow="Billing"
        title="Billing"
      />

      {checkout === "success" ? <Notice>Checkout completed or returned. Lemon Squeezy will finalize the status through the webhook.</Notice> : null}
      {error ? <Notice tone="error">{decodeURIComponent(error)}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          <CardHeader
            action={<Badge tone={statusTone}>{billing.org.plan_status.replace("_", " ")}</Badge>}
            description={`${formatDate(billing.periodStart)} to ${formatDate(billing.periodEnd)}. Local usage is the source of truth before provider reconciliation.`}
            title="Current billing period"
          />
          <div className="grid gap-3 p-5 md:grid-cols-3">
            <Metric detail="Billable campaign sends" icon={<Send className="h-5 w-5" />} label="Emails sent" value={billing.emailsSent.toLocaleString()} />
            <Metric detail="Disify/Reacher checks" icon={<ShieldCheck className="h-5 w-5" />} label="Validations" value={billing.validationsRun.toLocaleString()} />
            <Metric detail="Local estimate only" icon={<ReceiptText className="h-5 w-5" />} label="Estimate" value={formatCurrency(billing.estimatedCents)} />
          </div>
          <div className="border-t border-line/80 p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-line bg-field/70 p-4">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-moss">Provider state</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <BillingRow label="Customer" value={billing.org.billing_customer_id ?? "Not linked"} />
                  <BillingRow label="Subscription" value={billing.org.billing_subscription_id ?? "Not linked"} />
                  <BillingRow label="Unreported usage rows" value={billing.unreportedEvents.toLocaleString()} />
                </dl>
              </div>
              <div className="rounded-2xl border border-line bg-field/70 p-4">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-moss">Usage item IDs</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <BillingRow label="Email sends" value={billing.org.billing_email_item_id ?? "Waiting for webhook"} />
                  <BillingRow label="Validation runs" value={billing.org.billing_validation_item_id ?? "Waiting for webhook"} />
                  <BillingRow label="Checkout config" value={billing.checkoutConfigured ? "Ready" : "Missing env vars"} />
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-night text-amber">
              <CreditCard className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">Hosted billing</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Lemon Squeezy handles payment collection, international taxes, invoices, card updates, and subscription lifecycle. Project 2 only keeps the operational usage and plan state.
            </p>
            <form action={startBillingCheckout} className="mt-5">
              <SubmitButton className="w-full" disabled={!billing.checkoutConfigured} loadingLabel="Opening checkout" mode="process">
                Start checkout
                <ArrowUpRight className="h-4 w-4" />
              </SubmitButton>
            </form>
            {billing.portalUrl ? (
              <Button className="mt-3 w-full" href={billing.portalUrl} variant="secondary">
                Manage subscription
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            ) : (
              <p className="mt-3 rounded-2xl border border-line bg-field/70 px-3 py-2 text-xs leading-5 text-muted">
                Customer portal appears after the first active Lemon Squeezy customer is synced.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-moss" />
              <h2 className="text-base font-semibold text-ink">Launch checklist</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <ChecklistItem done={billing.checkoutConfigured}>Checkout API credentials configured</ChecklistItem>
              <ChecklistItem done={Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET)}>Webhook signing secret configured</ChecklistItem>
              <ChecklistItem done={Boolean(billing.org.billing_subscription_id)}>Subscription webhook received</ChecklistItem>
              <ChecklistItem done={Boolean(billing.org.billing_email_item_id || billing.org.billing_validation_item_id)}>Usage item IDs stored</ChecklistItem>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ detail, icon, label, value }: { detail: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-field/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.74rem] font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted">{detail}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber text-ink">{icon}</span>
      </div>
    </div>
  );
}

function BillingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="max-w-[12rem] truncate text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ChecklistItem({ children, done }: { children: React.ReactNode; done: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${done ? "bg-moss" : "bg-line"}`} />
      <span>{children}</span>
    </li>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === "error" ? "border-[#f3c2b8] bg-[#fff0ed] text-coral" : "border-[#d7e9d9] bg-[#edf7f0] text-moss"}`}>
      {children}
    </p>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en", { currency: "USD", style: "currency" }).format(cents / 100);
}
