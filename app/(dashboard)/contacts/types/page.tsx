import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { authMessage } from "@/lib/auth-messages";
import { createContactType, deleteContactType, listContactTypes } from "@/lib/contacts";

export default async function ContactTypesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const contactTypes = await listContactTypes();
  const { error } = await searchParams;
  const message = authMessage(error) ?? (error ? decodeURIComponent(error) : null);

  return (
    <>
      <PageHeader
        action={<Button href="/contacts" variant="secondary">Back to contacts</Button>}
        description="Manage the primary identity dropdown for contacts alongside tags and organization accounts."
        eyebrow="CRM"
        title="Contact types"
      />
      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Add type</h2>
          {message ? (
            <p className="mt-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {message}
            </p>
          ) : null}
          <form action={createContactType} className="mt-5 space-y-4">
            <label className="block space-y-2 text-sm font-medium text-ink">
              <span>Name</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="name" placeholder="Donor, Volunteer, Sponsor" required />
            </label>
            <label className="block space-y-2 text-sm font-medium text-ink">
              <span>Color</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue="#39705f" name="color" type="color" />
            </label>
            <Button className="w-full" type="submit">Add type</Button>
          </form>
        </Card>
        <Card>
          <CardHeader description={`${contactTypes.length} option${contactTypes.length === 1 ? "" : "s"} available in the contact form`} title="Dropdown options" />
          <div className="divide-y divide-line">
            {contactTypes.map((type) => {
              const deleteAction = deleteContactType.bind(null, type.id);
              return (
                <div className="flex items-center justify-between gap-4 px-5 py-4" key={type.id}>
                  <Badge tone="green">{type.name}</Badge>
                  <form action={deleteAction}>
                    <button className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition hover:bg-[#fff0ed] hover:text-coral" type="submit" aria-label={`Delete ${type.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
