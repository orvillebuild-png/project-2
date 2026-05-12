import { ArrowRight, CheckCircle2, Clock3, MailCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

const metrics = [
  { label: "Contacts", value: "0", detail: "Ready for import", icon: UsersRound },
  { label: "Valid emails", value: "0", detail: "Reacher pending setup", icon: MailCheck },
  { label: "Upcoming events", value: "0", detail: "Create your first event", icon: Clock3 },
  { label: "Billing status", value: "Draft", detail: "Lemon Squeezy planned", icon: CheckCircle2 }
];

const tasks = [
  "Connect Supabase and apply migrations",
  "Build signup, login, and organization creation",
  "Create first contact list with filtering",
  "Connect Lemon Squeezy billing adapter"
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        action={<Button href="/contacts">Open CRM</Button>}
        description="A focused workspace for managing nonprofit relationships, events, invitations, RSVPs, and usage billing."
        eyebrow="Phase 1"
        title="Operational home"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card className="p-5" key={metric.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{metric.value}</p>
                  <p className="mt-1 text-sm text-muted">{metric.detail}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#edf7f0] text-moss">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader
            action={<Badge tone="green">Build sequence active</Badge>}
            description="The product is being built to gates so every phase is independently visible and testable."
            title="Launch path"
          />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {tasks.map((task, index) => (
              <div className="rounded-md border border-line bg-field p-4" key={task}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Step {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-ink">{task}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader description="Early product surfaces before live data is wired." title="Quick actions" />
          <div className="divide-y divide-line">
            {[
              ["Import contacts", "/contacts/import"],
              ["Create event", "/events/new"],
              ["Start campaign", "/campaigns/new"],
              ["Review billing", "/settings/billing"]
            ].map(([label, href]) => (
              <Button className="h-auto w-full justify-between rounded-none px-5 py-4" href={href} key={href} variant="ghost">
                {label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
