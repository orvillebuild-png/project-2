import { Building2, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { listContactOrganizations } from "@/lib/contacts";

export default async function ContactOrganizationsPage() {
  const organizations = await listContactOrganizations();
  const totalContacts = organizations.reduce((sum, organization) => sum + organization.contact_count, 0);

  return (
    <>
      <PageHeader
        action={<Button href="/contacts" variant="secondary">Back to contacts</Button>}
        description="Account-style view of organizations represented in your CRM contacts."
        eyebrow="CRM"
        title="Organizations"
      />

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <Metric label="Organizations" value={organizations.length} />
        <Metric label="Linked contacts" value={totalContacts} />
        <Metric label="Verified emails" value={organizations.reduce((sum, organization) => sum + organization.verified_count, 0)} />
      </section>

      <Card>
        <CardHeader
          description="Organizations are currently inferred from the contact organization/account field."
          title="Organization accounts"
        />
        <div className="grid gap-3 p-5">
          {organizations.length > 0 ? organizations.map((organization) => (
            <a
              className="grid gap-3 rounded-2xl border border-line bg-field/72 p-4 transition hover:-translate-y-0.5 hover:border-moss/40 hover:bg-white hover:shadow-soft md:grid-cols-[1fr_10rem_10rem_12rem]"
              href={`/contacts?organization=${encodeURIComponent(organization.name)}`}
              key={organization.name}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber text-night">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">{organization.name}</h2>
                  <p className="mt-1 text-xs text-muted">Open filtered contact list</p>
                </div>
              </div>
              <Stat label="Contacts" value={organization.contact_count} />
              <Stat label="Verified" value={organization.verified_count} />
              <div className="text-sm text-muted">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em]">Last activity</p>
                <p className="mt-1 font-semibold text-ink">
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  }).format(new Date(organization.latest_contact_at))}
                </p>
              </div>
            </a>
          )) : (
            <div className="rounded-2xl border border-dashed border-line bg-field p-8 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-moss" />
              <h2 className="mt-3 text-base font-semibold text-ink">No organizations yet</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Add organization/account names to contacts to build this view.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white/70 px-3 py-2">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}
