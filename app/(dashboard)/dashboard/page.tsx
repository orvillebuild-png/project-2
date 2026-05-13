import { ArrowRight, CheckCircle2, Clock3, MailCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

const metrics = [
  { label: "Contacts", value: "0", detail: "Ready for import", icon: UsersRound, color: "bg-amber" },
  { label: "Valid emails", value: "0", detail: "Reacher pending setup", icon: MailCheck, color: "bg-skywash" },
  { label: "Upcoming events", value: "0", detail: "Create your first event", icon: Clock3, color: "bg-[#dff8ea]" },
  { label: "Billing status", value: "Draft", detail: "Lemon Squeezy later", icon: CheckCircle2, color: "bg-night text-white" }
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
      <section className="mb-5 overflow-hidden rounded-[2rem] border border-white/70 bg-amber shadow-lift ring-1 ring-ink/5">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:p-7">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink/70">Project 2 workspace</p>
            <h1 className="mt-3 max-w-2xl text-[2.35rem] font-semibold leading-[1.02] text-ink md:text-[3.2rem]">
              Operational home for events, contacts, cards, and RSVP.
            </h1>
            <p className="mt-4 max-w-xl text-[0.9rem] leading-6 text-ink/72">
              A focused nonprofit command center with each workflow visible, testable, and ready to become production-grade.
            </p>
          </div>
          <div className="flex items-end md:min-w-56 md:justify-end">
            <Button className="bg-night text-white" href="/contacts">Open CRM</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card className="p-4" key={metric.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.78rem] font-medium text-muted">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{metric.value}</p>
                  <p className="mt-1 text-[0.78rem] text-muted">{metric.detail}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="order-2 xl:order-1">
          <CardHeader
            action={<Badge tone="green">Build sequence active</Badge>}
            description="The product is being built to gates so every phase is independently visible and testable."
            title="Launch path"
          />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {tasks.map((task, index) => (
              <div className="rounded-2xl border border-line/80 bg-field/80 p-4" key={task}>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-moss">Step {index + 1}</p>
                <p className="mt-2 text-[0.86rem] font-medium text-ink">{task}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="order-1 xl:order-2">
          <CardHeader description="Early product surfaces before live data is wired." title="Quick actions" />
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 xl:block xl:divide-y xl:divide-line xl:p-0">
            {[
              ["Import contacts", "/contacts/import"],
              ["Create event", "/events/new"],
              ["Start campaign", "/campaigns/new"],
              ["Review billing", "/settings/billing"]
            ].map(([label, href]) => (
              <Button className="h-auto w-full justify-between rounded-2xl border border-line/70 bg-field/80 px-3 py-3 text-left xl:rounded-none xl:border-0 xl:bg-transparent xl:px-5 xl:py-4" href={href} key={href} variant="ghost">
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
