import { Plus, Settings2, Tags, Upload } from "lucide-react";
import { ContactFilters } from "@/components/contacts/ContactFilters";
import { ContactTable } from "@/components/contacts/ContactTable";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { listContacts, listContactSources, listContactTypes, listTags } from "@/lib/contacts";

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
    tag?: string;
    type?: string;
  }>;
}) {
  const filters = await searchParams;
  const [contacts, contactTypes, tags, sources] = await Promise.all([
    listContacts(filters),
    listContactTypes(),
    listTags(),
    listContactSources()
  ]);

  return (
    <>
      <PageHeader
        action={
          <div className="flex gap-2">
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
      <Card>
        <CardHeader
          action={
            <ContactFilters
              search={filters.search}
              selectedAge={filters.age}
              selectedLimit={filters.limit}
              selectedOrganization={filters.organization}
              selectedSex={filters.sex}
              selectedSource={filters.source}
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
        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button className="h-9 px-3" href="/contacts/tags" variant="ghost">
              <Tags className="h-4 w-4" />
              Manage tags
            </Button>
            <Button className="h-9 px-3" href="/contacts/types" variant="ghost">
              <Settings2 className="h-4 w-4" />
              Manage contact types
            </Button>
          </div>
          {contacts.length > 0 ? (
            <ContactTable contacts={contacts} tags={tags} />
          ) : (
            <EmptyState
              actionLabel="Add contact"
              description="Start with a single contact. CSV import, tags, filters, and validation jobs come next in Phase 2."
              href="/contacts/new"
              title="No contacts yet"
            />
          )}
        </div>
      </Card>
    </>
  );
}
