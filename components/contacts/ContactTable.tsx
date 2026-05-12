import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import type { ContactListItem } from "@/lib/contacts";
import { contactDisplayName } from "@/lib/contacts";

export function ContactTable({ contacts }: { contacts: ContactListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse bg-white text-left text-sm">
        <thead className="bg-field text-xs font-bold uppercase tracking-[0.12em] text-muted">
          <tr>
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
  );
}
