import { Plus, Upload } from "lucide-react";
import { ContactTable } from "@/components/contacts/ContactTable";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { listContacts } from "@/lib/contacts";

export default async function ContactsPage() {
  const contacts = await listContacts();

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
          description={`${contacts.length} contact${contacts.length === 1 ? "" : "s"} in the current workspace`}
          title="Contact list"
        />
        <div className="p-5">
          {contacts.length > 0 ? (
            <ContactTable contacts={contacts} />
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
