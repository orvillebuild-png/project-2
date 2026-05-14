import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import type { ContactListItem, ContactTag } from "@/lib/contacts";
import { bulkDeleteContacts, bulkTagContacts, contactDisplayName } from "@/lib/contacts";
import { verifySelectedContacts } from "@/lib/email-verification";

export function ContactTable({
  contacts,
  footer,
  tags
}: {
  contacts: ContactListItem[];
  footer?: React.ReactNode;
  tags: ContactTag[];
}) {
  return (
    <div className="space-y-3">
      <form className="space-y-3">
        <div className="sticky top-2 z-10 flex flex-col gap-2 rounded-2xl border border-line/90 bg-[#fff8dc]/92 px-3 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.8rem] font-semibold text-ink">Bulk actions</p>
            <p className="text-[0.72rem] text-muted">Select contacts below, then apply one action.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              className="col-span-2 h-9 rounded-full border border-line bg-white px-3 text-[0.8rem] outline-none focus:border-moss sm:col-span-1 sm:min-w-44"
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
              className="inline-flex h-9 items-center justify-center rounded-full bg-moss px-3 text-[0.8rem] font-semibold text-white shadow-sm transition hover:bg-[#315f51]"
              formAction={bulkTagContacts}
              type="submit"
            >
              Apply tag
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-white px-3 text-[0.8rem] font-semibold text-ink transition hover:bg-white"
              formAction={verifySelectedContacts}
              type="submit"
            >
              Verify selected
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-white px-3 text-[0.8rem] font-semibold text-ink transition hover:bg-white"
              formAction={bulkDeleteContacts}
              type="submit"
            >
              Delete selected
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:hidden">
          {contacts.map((contact) => (
            <div className="rounded-2xl border border-line/90 bg-white/84 p-4 shadow-sm" key={contact.id}>
              <div className="flex items-start gap-3">
                <input
                  aria-label={`Select ${contactDisplayName(contact)}`}
                  className="mt-1 h-4 w-4 rounded border-line text-moss focus:ring-moss"
                  name="contact_ids"
                  type="checkbox"
                  value={contact.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink">{contactDisplayName(contact)}</h3>
                      <p className="mt-1 truncate text-[0.78rem] text-muted">{contact.email}</p>
                    </div>
                    <EmailStatusBadge status={contact.email_status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[0.76rem]">
                    <InfoPill label="Org" value={contact.organization_name ?? "Individual"} />
                    <InfoPill label="Type" value={contact.contact_types?.name ?? "Unassigned"} />
                    <InfoPill label="Source" value={contact.source ?? "Manual"} />
                    <InfoPill label="Tags" value={contact.contact_tags?.length ? contact.contact_tags.map((tag) => tag.name).join(", ") : "None"} />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button className="h-8 px-3" href={`/contacts/${contact.id}`} variant="secondary">Open</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-line lg:block">
          <table className="w-full min-w-[1120px] border-collapse bg-white text-left text-sm">
            <thead className="bg-[#f7f4eb] text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted">
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
                <tr className="transition hover:bg-[#fff8dc]/50" key={contact.id}>
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Select ${contactDisplayName(contact)}`}
                      className="h-4 w-4 rounded border-line text-moss focus:ring-moss"
                      name="contact_ids"
                      type="checkbox"
                      value={contact.id}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{contactDisplayName(contact)}</p>
                    <p className="text-xs text-muted">{contact.contact_types?.name ?? "Unassigned"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{contact.organization_name ?? "Individual"}</td>
                  <td className="px-4 py-3 text-muted">{contact.email}</td>
                  <td className="px-4 py-3">
                    <EmailStatusBadge status={contact.email_status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {contact.contact_tags && contact.contact_tags.length > 0
                      ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.contact_tags.slice(0, 3).map((tag) => (
                              <span className="rounded-full border border-line bg-field px-2 py-0.5 text-[0.7rem] font-semibold text-muted" key={tag.id}>{tag.name}</span>
                            ))}
                          </div>
                        )
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
      {footer ? <div className="flex justify-end">{footer}</div> : null}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-field/70 px-3 py-2">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 truncate font-semibold text-ink">{value}</p>
    </div>
  );
}
