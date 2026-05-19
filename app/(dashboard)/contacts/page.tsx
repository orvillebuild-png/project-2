import { Building2, Plus, Settings2, Tags, Upload } from "lucide-react";
import { ContactFilters } from "@/components/contacts/ContactFilters";
import { ContactTable } from "@/components/contacts/ContactTable";
import { RowLimitControl } from "@/components/contacts/RowLimitControl";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getContactMetrics, listContacts, listContactSources, listContactTypes, listTags } from "@/lib/contacts";

export default async function ContactsPage({
  searchParams
}: {
  searchParams: Promise<{
    age?: string;
    limit?: string;
    organization?: string;
    search?: string;
    sex?: string;
    source?: string;
    status?: string;
    tag?: string;
    type?: string;
    verified?: string;
  }>;
}) {
  const filters = await searchParams;
  const [contacts, contactTypes, tags, sources, metrics] = await Promise.all([
    listContacts(filters),
    listContactTypes(),
    listTags(),
    listContactSources(),
    getContactMetrics()
  ]);

  return (
    <>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/contacts/organizations" variant="secondary">
              <Building2 className="h-4 w-4" />
              Organizations
            </Button>
            <Button href="/contacts/import" variant="secondary">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button href="/contacts/new">
              <Plus className="h-4 w-4" />
              Contact
            </Button>
          </div>
        }
        description="Manage people, relationship source, and email health before events and invitation campaigns are added."
        eyebrow="CRM"
        title="Contacts"
      />
      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <MetricCard label="Total contacts" value={metrics.total} detail={`${contacts.length} visible in this view`} />
        <MetricCard label="Verified email" value={metrics.verified} detail="Ready for campaigns" />
        <MetricCard label="Organizations" value={metrics.organizations} detail="Total linked accounts" />
      </section>
      <Card className="overflow-hidden">
        <CardHeader
          action={
            <ContactFilters
              search={filters.search}
              selectedAge={filters.age}
              selectedOrganization={filters.organization}
              selectedSex={filters.sex}
              selectedSource={filters.source}
              selectedStatus={filters.status}
              selectedTag={filters.tag}
              selectedType={filters.type}
              sources={sources}
              tags={tags}
              types={contactTypes}
            />
          }
          description={`Showing ${contacts.length} contact${contacts.length === 1 ? "" : "s"} in the current view`}
          title="Contact list"
        />
        <div className="p-4 sm:p-5">
          {filters.verified ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Verified {filters.verified} selected contact{filters.verified === "1" ? "" : "s"}.
            </p>
          ) : null}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line/80 bg-field/70 px-3 py-3">
            <p className="text-[0.78rem] font-semibold text-muted">CRM settings</p>
            <div className="flex flex-wrap items-center gap-2">
            <Button className="h-9 px-3" href="/contacts/tags" variant="ghost">
              <Tags className="h-4 w-4" />
              Manage tags
            </Button>
            <Button className="h-9 px-3" href="/contacts/types" variant="ghost">
              <Settings2 className="h-4 w-4" />
              Manage contact types
            </Button>
            </div>
          </div>
          {contacts.length > 0 ? (
            <ContactTable
              contacts={contacts}
              footer={
                <RowLimitControl
                  action="/contacts"
                  filters={{
                    age: filters.age,
                    organization: filters.organization,
                    search: filters.search,
                    sex: filters.sex,
                    source: filters.source,
                    status: filters.status,
                    tag: filters.tag,
                    type: filters.type
                  }}
                  selectedLimit={filters.limit}
                />
              }
              tags={tags}
            />
          ) : (
            <EmptyState
              actionLabel="Add contact"
              description="Start with a single contact, import a CSV, or organize people by tags, types, and organizations."
              href="/contacts/new"
              title="No contacts yet"
            />
          )}
        </div>
      </Card>
    </>
  );
}

function MetricCard({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div className="surface-in rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[0.78rem] text-muted">{detail}</p>
    </div>
  );
}
