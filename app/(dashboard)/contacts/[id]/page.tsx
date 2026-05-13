import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authMessage } from "@/lib/auth-messages";
import { contactDisplayName, getContact, getContactHistory, listContactTypes, listTags, softDeleteContact, updateContact } from "@/lib/contacts";
import { verifyContact } from "@/lib/email-verification";

export default async function ContactDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; verified?: string }>;
}) {
  const { id } = await params;
  const { error, saved, verified } = await searchParams;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  const [contactTypes, tags, history] = await Promise.all([listContactTypes(), listTags(), getContactHistory(id)]);
  const activeTagIds = new Set((contact.contact_tags ?? []).map((tag) => tag.id));

  const updateAction = updateContact.bind(null, id);
  const deleteAction = softDeleteContact.bind(null, id);
  const verifyAction = verifyContact.bind(null, id);
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
          {verified ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Email verification complete.
            </p>
          ) : null}
          <form action={updateAction} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Salutation</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.salutation ?? ""} name="salutation" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Contact type</span>
              <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.contact_type_id ?? ""} name="contact_type_id">
                <option value="">None</option>
                {contactTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </label>
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
              <span>Alternate email</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.alternate_email ?? ""} name="alternate_email" type="email" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Alternate phone</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.alternate_phone ?? ""} name="alternate_phone" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
              <span>Organization / account</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.organization_name ?? ""} name="organization_name" />
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
            <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
              <span>Address line 1</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.address_line1 ?? ""} name="address_line1" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
              <span>Address line 2</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.address_line2 ?? ""} name="address_line2" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>City</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.city ?? ""} name="city" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>State / province</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.state_province ?? ""} name="state_province" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Postal code</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.postal_code ?? ""} name="postal_code" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Country</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={contact.country ?? ""} name="country" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
              <span>Source</span>
              <input name="source" type="hidden" value={contact.source ?? "Manual Entry"} />
              <input className="h-11 w-full rounded-md border border-line px-3 outline-none" disabled value={contact.source ?? "Manual Entry"} />
            </label>
            <fieldset className="space-y-3 rounded-lg border border-line bg-field p-4 md:col-span-2">
              <legend className="px-1 text-sm font-semibold text-ink">Tags</legend>
              {tags.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {tags.map((tag) => (
                    <label className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink" key={tag.id}>
                      <input className="h-4 w-4 accent-moss" defaultChecked={activeTagIds.has(tag.id)} name="tag_ids" type="checkbox" value={tag.id} />
                      {tag.name}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No tags yet. Add tags from the contact list.</p>
              )}
            </fieldset>
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
              Disify checks format, disposable status, and domain records. If it is unavailable, the app falls back to local syntax and MX checks.
            </p>
            <form action={verifyAction} className="mt-4">
              <Button className="w-full" type="submit" variant="secondary">Verify email</Button>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">History</h2>
            {history.length > 0 ? (
              <div className="mt-3 space-y-3">
                {history.map((item) => (
                  <div className="rounded-md border border-line bg-field p-3" key={item.id}>
                    <p className="text-sm font-semibold text-ink">
                      {item.action === "import_created" ? "Created by import" : item.action === "import_updated" ? "Updated by import" : "Updated"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      }).format(new Date(item.created_at))}
                    </p>
                    {item.source ? <p className="mt-1 text-xs text-muted">Source: {item.source}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">No history recorded yet.</p>
            )}
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
