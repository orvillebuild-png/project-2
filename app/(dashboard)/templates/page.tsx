/* eslint-disable @next/next/no-img-element */
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  Church,
  Clapperboard,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Megaphone,
  PartyPopper,
  Plus,
  Presentation,
  Sparkles,
  Stethoscope,
  UsersRound
} from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { deleteLibraryTemplate, listLibraryTemplates } from "@/lib/templates";

export default async function TemplatesPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; deleted?: string; error?: string }>;
}) {
  const [{ created, deleted, error }, templates] = await Promise.all([
    searchParams,
    listLibraryTemplates()
  ]);

  return (
    <>
      <PageHeader
        action={
          <Button href="/templates/new">
            <Plus className="h-4 w-4" />
            New template
          </Button>
        }
        description="Reusable email layouts for invitations, updates, and RSVP campaigns."
        eyebrow="Email"
        title="Templates"
      />

      {error ? <Notice tone="error">{decodeURIComponent(error)}</Notice> : null}
      {created ? <Notice>Template created.</Notice> : null}
      {deleted ? <Notice>Template deleted.</Notice> : null}

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <Metric label="Reusable templates" value={templates.length} detail="Library items" />
        <Metric label="Merge fields" value={5} detail="Available tokens" />
        <Metric label="Editor" value={1} detail="Visual builder" />
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          description="Start a campaign from a saved template, or keep refining reusable layouts here."
          title="Template library"
        />
        <div className="p-5">
          {templates.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => {
                const deleteAction = deleteLibraryTemplate.bind(null, template.id);

                const visual = templateVisual(template.name);
                const Icon = visual.icon;
                const imageUrl = template.design_data.image_url;
                const accent = template.design_data.accent_color || visual.accent;
                const header = template.design_data.header_bg || visual.header;

                return (
                  <article className="group overflow-hidden rounded-[1.35rem] border border-line bg-field/70 shadow-sm transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-soft" key={template.id}>
                    <div className="relative min-h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${header}, ${visual.wash})` }}>
                      {imageUrl ? (
                        <img alt={template.design_data.image_alt || template.name} className="absolute inset-0 h-full w-full object-cover opacity-72 transition duration-300 group-hover:scale-[1.03]" src={imageUrl} />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-br from-black/72 via-black/22 to-black/48" />
                      <div className="relative flex h-full min-h-36 flex-col justify-between p-4 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/14 text-white backdrop-blur">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="rounded-full border border-white/20 bg-white/14 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
                            {visual.category}
                          </span>
                        </div>
                        <div>
                          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: accent }}>{visual.mood}</p>
                          <h2 className="mt-1 text-lg font-semibold leading-tight">{template.name}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone="green">Reusable</Badge>
                        <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted">{template.design_data.email_builder_font?.replace("_", " ").toLowerCase()}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted">
                        {template.description || template.subject}
                      </p>
                      <div className="mt-4 rounded-xl border border-line bg-white/70 px-3 py-3">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted">Subject</p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{template.subject}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button className="h-9 px-3" href={`/campaigns/new?template=${template.id}`}>
                          Use template
                        </Button>
                        <Button className="h-9 px-3" href={`/templates/${template.id}/edit`} variant="secondary">
                          Edit
                        </Button>
                        <form action={deleteAction}>
                          <Button className="h-9 px-3 text-coral" type="submit" variant="ghost">Delete</Button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              actionLabel="Create template"
              description="Save your first reusable campaign layout, then start future campaigns from it."
              href="/templates/new"
              title="No reusable templates yet"
            />
          )}
        </div>
      </Card>
    </>
  );
}

function templateVisual(name: string) {
  const lower = name.toLowerCase();
  const visuals = [
    { test: "wedding", icon: Sparkles, category: "Wedding", mood: "Romantic", accent: "#d7a85d", header: "#2f2624", wash: "#f7efe6" },
    { test: "gala", icon: PartyPopper, category: "Gala", mood: "Formal", accent: "#ffca3a", header: "#151515", wash: "#664d03" },
    { test: "volunteer", icon: HeartHandshake, category: "Volunteer", mood: "Welcoming", accent: "#ffca3a", header: "#1f6b5d", wash: "#dff8ea" },
    { test: "community", icon: UsersRound, category: "Outreach", mood: "Local action", accent: "#f4b942", header: "#0f3d3e", wash: "#edf6f6" },
    { test: "donor", icon: HeartHandshake, category: "Donor", mood: "Gratitude", accent: "#d7a85d", header: "#2f2624", wash: "#f7efe6" },
    { test: "board", icon: BriefcaseBusiness, category: "Board", mood: "Operational", accent: "#9be7b1", header: "#101820", wash: "#eef1f3" },
    { test: "workshop", icon: BookOpen, category: "Workshop", mood: "Hands-on", accent: "#ffd166", header: "#243b53", wash: "#eef4fb" },
    { test: "webinar", icon: Laptop, category: "Webinar", mood: "Online", accent: "#60a5fa", header: "#111827", wash: "#eff6ff" },
    { test: "faith", icon: Church, category: "Faith", mood: "Gathering", accent: "#f6d365", header: "#2d2a4a", wash: "#f5f2ff" },
    { test: "reunion", icon: GraduationCap, category: "Reunion", mood: "Nostalgic", accent: "#f59e0b", header: "#1f2937", wash: "#fff7ed" },
    { test: "launch", icon: Megaphone, category: "Launch", mood: "Reveal", accent: "#00d084", header: "#050505", wash: "#eefbf5" },
    { test: "auction", icon: Clapperboard, category: "Auction", mood: "Benefit", accent: "#fbbf24", header: "#1c1917", wash: "#faf3e7" },
    { test: "medical", icon: Stethoscope, category: "Medical", mood: "Service", accent: "#38bdf8", header: "#075985", wash: "#eef9ff" },
    { test: "holiday", icon: PartyPopper, category: "Holiday", mood: "Seasonal", accent: "#f8c471", header: "#3f1d2b", wash: "#fff4e6" },
    { test: "conference", icon: Presentation, category: "Conference", mood: "Professional", accent: "#7dd3fc", header: "#12263a", wash: "#f0f7fb" }
  ];

  return visuals.find((visual) => lower.includes(visual.test)) ?? {
    icon: CalendarCheck,
    category: "Event",
    mood: "Invitation",
    accent: "#ffca3a",
    header: "#151515",
    wash: "#f8f5eb"
  };
}

function Metric({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div className="surface-in rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[0.78rem] text-muted">{detail}</p>
    </div>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === "error" ? "border-[#f3c2b8] bg-[#fff0ed] text-coral" : "border-[#d7e9d9] bg-[#edf7f0] text-moss"}`}>
      {children}
    </p>
  );
}
