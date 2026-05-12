import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

const settings = [
  ["Organization profile", "Name, logo, color, and public registration slug"],
  ["Sender identity", "Resend sender name, reply-to, and domain verification"],
  ["Team access", "Admins, members, and invite links"],
  ["Audit log", "Append-only operational history"]
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        action={<Button href="/settings/billing" variant="secondary">Billing</Button>}
        description="Control organization identity, users, sending, billing, and audit history."
        eyebrow="Admin"
        title="Settings"
      />
      <Card>
        <CardHeader description="Core settings surfaces planned for Phase 6." title="Organization controls" />
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {settings.map(([title, description]) => (
            <div className="rounded-md border border-line bg-field p-4" key={title}>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
