import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import type { ContactListItem, ContactTag } from "@/lib/contacts";
import { bulkDeleteContacts, bulkTagContacts, contactDisplayName } from "@/lib/contacts";

export function ContactTable({ contacts, tags }: { contacts: ContactListItem[]; tags: ContactTag[] }) {
  return (
    <form className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-field px-3 py-3">
        <p className="text-sm font-semibold text-ink">Bulk actions</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 min-w-44 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-moss"
            defaultValue=""
            disabled={tags.length === 0}
            name="bulk_tag_id"
          >
            <option value="">Choose tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          <button
            className="inline-flex h-9 items-center justify-center rounded-md bg-moss px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#315f51]"
            formAction={bulkTagContacts}
            type="submit"
          >
            Apply tag
          </button>
          <button
            className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:bg-white"
            formAction={bulkDeleteContacts}
            type="submit"
          >
            Delete selected
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="min-w-[1120px] w-full border-collapse bg-white text-left text-sm">
          <thead className="bg-field text-xs font-bold uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {contacts.map((contact) => (
              <tr className="hover:bg-field/70" key={contact.id}>
                <td className="px-4 py-3">
                  <input
                    aria-label={`Select ${contactDisplayName(contact)}`}
                    className="h-4 w-4 rounded border-line text-moss focus:ring-moss"
                    name="contact_ids"
                    type="checkbox"
                    value={contact.id}
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-ink">{contactDisplayName(contact)}</td>
                <td className="px-4 py-3 text-muted">{contact.organization_name ?? "Individual"}</td>
                <td className="px-4 py-3 text-muted">{contact.email}</td>
                <td className="px-4 py-3">
                  <EmailStatusBadge status={contact.email_status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {contact.contact_tags && contact.contact_tags.length > 0
                    ? contact.contact_tags.map((tag) => tag.name).join(", ")
                    : "None"}
                </td>
                <td className="px-4 py-3 text-muted">{contact.source ?? "Manual"}</td>
                <td className="px-4 py-3 text-muted">
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  }).format(new Date(contact.created_at))}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button href={`/contacts/${contact.id}`} variant="secondary">Open</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
