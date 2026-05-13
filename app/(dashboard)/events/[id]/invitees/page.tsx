import { notFound } from "next/navigation";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { RowLimitControl } from "@/components/contacts/RowLimitControl";
import { InviteeFilterForm } from "@/components/events/InviteeFilterForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { contactDisplayName, listContactSources, listContactTypes, listTags } from "@/lib/contacts";
import { getEvent } from "@/lib/events";
import { addEventInvitees, listEventInvitees, listInviteeCandidates, removeEventInvitees } from "@/lib/invitees";

export default async function EventInviteesPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    added?: string;
    age?: string;
    error?: string;
    limit?: string;
    organization?: string;
    removed?: string;
    search?: string;
    sex?: string;
    source?: string;
    tag?: string;
    type?: string;
  }>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const [event, invitees, candidates, contactTypes, tags, sources] = await Promise.all([
    getEvent(id),
    listEventInvitees(id),
    listInviteeCandidates(filters),
    listContactTypes(),
    listTags(),
    listContactSources()
  ]);

  if (!event) {
    notFound();
  }

  const invitedContactIds = new Set(invitees.map((invitee) => invitee.contact_id));
  const addInviteesAction = addEventInvitees.bind(null, event.id);
  const removeInviteesAction = removeEventInvitees.bind(null, event.id);

  return (
    <>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/contacts/import" variant="secondary">Upload contacts</Button>
            <Button href={`/events/${event.id}`} variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to event
            </Button>
          </div>
        }
        description="Build the audience for this event before campaign drafting."
        eyebrow="Invitees"
        title={event.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader
            action={
              <InviteeFilterForm
                action={`/events/${event.id}/invitees`}
                search={filters.search}
                selectedAge={filters.age}
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
            description={`Showing ${candidates.length} contact${candidates.length === 1 ? "" : "s"} from the current filters`}
            title="Find contacts"
          />
          <div className="p-5">
            {filters.error ? (
              <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
                {filters.error === "missing_selection" ? "Select at least one contact first." : decodeURIComponent(filters.error)}
              </p>
            ) : null}
            {filters.added ? (
              <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
                Added {filters.added} invitee{filters.added === "1" ? "" : "s"}.
              </p>
            ) : null}
            <form action={addInviteesAction} className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="min-w-[940px] w-full border-collapse bg-white text-left text-sm">
                  <thead className="bg-field text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="w-10 px-4 py-3"><span className="sr-only">Select</span></th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Tags</th>
                      <th className="px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {candidates.map((contact) => {
                      const alreadyInvited = invitedContactIds.has(contact.id);
                      return (
                        <tr className="hover:bg-field/70" key={contact.id}>
                          <td className="px-4 py-3">
                            <input
                              aria-label={`Select ${contactDisplayName(contact)}`}
                              className="h-4 w-4 rounded border-line text-moss focus:ring-moss disabled:opacity-50"
                              disabled={alreadyInvited}
                              name="contact_ids"
                              type="checkbox"
                              value={contact.id}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{contactDisplayName(contact)}</span>
                              {alreadyInvited ? <Badge tone="green">selected</Badge> : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted">{contact.organization_name ?? "Individual"}</td>
                          <td className="px-4 py-3 text-muted">{contact.email}</td>
                          <td className="px-4 py-3 text-muted">
                            {contact.contact_tags && contact.contact_tags.length > 0
                              ? contact.contact_tags.map((tag) => tag.name).join(", ")
                              : "None"}
                          </td>
                          <td className="px-4 py-3 text-muted">{contact.source ?? "Manual"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button type="submit">
                  <UserPlus className="h-4 w-4" />
                  Add selected
                </Button>
              </div>
            </form>
            <div className="mt-3 flex justify-end">
              <RowLimitControl
                action={`/events/${event.id}/invitees`}
                filters={{
                  age: filters.age,
                  organization: filters.organization,
                  search: filters.search,
                  sex: filters.sex,
                  source: filters.source,
                  tag: filters.tag,
                  type: filters.type
                }}
                selectedLimit={filters.limit}
              />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader
            description={`${invitees.length} contact${invitees.length === 1 ? "" : "s"} attached to this event`}
            title="Selected invitees"
          />
          <div className="p-5">
            {filters.removed ? (
              <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
                Removed {filters.removed} invitee{filters.removed === "1" ? "" : "s"}.
              </p>
            ) : null}
            {invitees.length > 0 ? (
              <form action={removeInviteesAction} className="space-y-3">
                <div className="max-h-[34rem] overflow-y-auto rounded-lg border border-line">
                  <div className="divide-y divide-line bg-white">
                    {invitees.map((invitee) => (
                      <label className="flex gap-3 px-3 py-3 hover:bg-field/70" key={invitee.contact_id}>
                        <input
                          className="mt-1 h-4 w-4 rounded border-line text-moss focus:ring-moss"
                          name="invitee_contact_ids"
                          type="checkbox"
                          value={invitee.contact_id}
                        />
                        <span>
                          <span className="block text-sm font-semibold text-ink">{contactDisplayName(invitee.contacts)}</span>
                          <span className="block text-xs text-muted">{invitee.contacts.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="w-full" type="submit" variant="secondary">Remove selected</Button>
              </form>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-field px-4 py-8 text-center">
                <Users className="mx-auto h-6 w-6 text-moss" />
                <p className="mt-3 text-sm font-semibold text-ink">No invitees selected</p>
                <p className="mt-1 text-sm text-muted">Use the filtered contact list to add people.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
