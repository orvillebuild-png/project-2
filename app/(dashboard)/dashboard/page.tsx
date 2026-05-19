import { ArrowRight, CalendarDays, Clock3, Mail, MailCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getDashboardStats, type DashboardEvent } from "@/lib/dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const metrics = [
    { label: "Contacts", value: stats.contacts.toLocaleString(), detail: "Total CRM records", icon: UsersRound, color: "bg-amber" },
    { label: "Valid emails", value: stats.validEmails.toLocaleString(), detail: "Ready for campaigns", icon: MailCheck, color: "bg-skywash" },
    { label: "Upcoming events", value: stats.upcomingEvents.toLocaleString(), detail: "Scheduled from today", icon: Clock3, color: "bg-[#dff8ea]" },
    { label: "Campaigns", value: stats.campaigns.toLocaleString(), detail: "Drafts and sends", icon: Mail, color: "bg-night text-white" }
  ];

  return (
    <>
      <section className="mb-5 overflow-hidden rounded-[2rem] border border-white/70 bg-amber shadow-lift ring-1 ring-ink/5">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:p-7">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink/70">Project 2 workspace</p>
            <h1 className="mt-3 max-w-2xl text-[2.35rem] font-semibold leading-[1.02] text-ink md:text-[3.2rem]">
              Operational home for contacts, events, campaigns, and RSVP.
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
            action={<Button className="h-8 px-3" href="/events" variant="secondary">Open events</Button>}
            description="Quick view of upcoming event dates and venues."
            title="Event calendar"
          />
          <CalendarPanel events={stats.upcoming} />
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

function CalendarPanel({ events }: { events: DashboardEvent[] }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOffset = monthStart.getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const eventsByDay = new Map<number, DashboardEvent[]>();

  for (const event of events) {
    if (!event.starts_at) {
      continue;
    }

    const date = new Date(event.starts_at);

    if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
      continue;
    }

    const dayEvents = eventsByDay.get(date.getDate()) ?? [];
    dayEvents.push(event);
    eventsByDay.set(date.getDate(), dayEvents);
  }

  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[1fr_18rem]">
      <div className="rounded-[1.4rem] border border-line/80 bg-field/70 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-moss">This month</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">
              {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(now)}
            </h3>
          </div>
          <CalendarDays className="h-5 w-5 text-moss" />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            const dayEvents = day ? eventsByDay.get(day) ?? [] : [];
            const isToday = day === now.getDate();

            return (
              <div
                className={`min-h-16 rounded-xl border px-2 py-1 text-sm ${
                  day
                    ? isToday
                      ? "border-amber bg-amber/30 text-ink"
                      : dayEvents.length > 0
                        ? "border-moss/30 bg-white text-ink"
                        : "border-line/70 bg-white/50 text-muted"
                    : "border-transparent"
                }`}
                key={`${day ?? "blank"}-${index}`}
              >
                {day ? (
                  <>
                    <span className="font-semibold">{day}</span>
                    {dayEvents.length > 0 ? (
                      <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-moss" />
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-moss">Upcoming</p>
        {events.length > 0 ? events.map((event) => (
          <a className="block rounded-2xl border border-line/80 bg-white/74 p-3 transition hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-soft" href={`/events/${event.id}`} key={event.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{event.title}</p>
              <Badge tone={event.status === "published" ? "green" : "amber"}>{event.status}</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{formatEventDate(event.starts_at)}</p>
            <p className="mt-1 truncate text-xs text-muted">{event.locations?.name ?? "Location not set"}</p>
          </a>
        )) : (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 p-4 text-sm leading-6 text-muted">
            No upcoming events yet.
          </div>
        )}
      </div>
    </div>
  );
}

function formatEventDate(value: string | null) {
  if (!value) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
