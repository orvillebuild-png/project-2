import { Plus, Upload } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export default function ContactsPage() {
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
        description="The CRM will support tags, URL-backed filters, CSV import/export, validation badges, and self-registration."
        eyebrow="CRM"
        title="Contacts"
      />
      <Card>
        <CardHeader description="Live contact data will appear after Supabase is connected." title="Contact list" />
        <div className="p-5">
          <EmptyState
            actionLabel="Add contact"
            description="Start with a single contact or import a CSV once the background import job is wired."
            href="/contacts/new"
            title="No contacts yet"
          />
        </div>
      </Card>
    </>
  );
}
