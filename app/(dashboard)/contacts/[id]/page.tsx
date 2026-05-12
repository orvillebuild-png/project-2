import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authMessage } from "@/lib/auth-messages";
import { contactDisplayName, getContact, softDeleteContact, updateContact } from "@/lib/contacts";

export default async function ContactDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  const updateAction = updateContact.bind(null, id);
  const deleteAction = softDeleteContact.bind(null, id);
  const message = authMessage(error) ?? (error ? decodeURIComponent(error) : null);

  return (
    <>
      <PageHeader
        action={<Button href="/contacts" variant="secondary">Back to contacts</Button>}
        description="Edit contact details, review email status, or remove the contact from active lists."
        eyebrow="CRM"
        title={contactDisplayName(contact)}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="p-5">
          {message ? (
            <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {message}
            </p>
          ) : null}
          {saved ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Contact updated.
            </p>
          ) : null}
          <form action={updateAction} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>First name</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.first_name ?? ""} name="first_name" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Last name</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.last_name ?? ""} name="last_name" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Email</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.email} name="email" required type="email" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Phone</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.phone ?? ""} name="phone" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Source</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.source ?? ""} name="source" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Age</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.age ?? ""} min="0" name="age" type="number" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Sex</span>
              <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.sex ?? ""} name="sex">
                <option value="">Not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit">Save changes</Button>
              <Button href="/contacts" variant="secondary">Cancel</Button>
            </div>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Email status</h2>
            <div className="mt-3">
              <EmailStatusBadge status={contact.email_status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              Email validation will update this automatically once Reacher is connected.
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Danger zone</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This removes the contact from active lists while preserving historical activity.
            </p>
            <form action={deleteAction} className="mt-4">
              <Button className="w-full border-[#f3c2b8] text-coral hover:bg-[#fff0ed]" type="submit" variant="secondary">
                Delete contact
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </>
  );
}
