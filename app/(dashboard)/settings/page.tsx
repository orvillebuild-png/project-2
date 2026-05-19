import { Globe2, MailCheck, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { createSenderDomain, getSettingsData, inviteTeamMember, removeSenderDomain, updateOrganizationSettings, verifySenderDomain } from "@/lib/settings";

const timezones = [
  "Asia/Manila",
  "Asia/Taipei",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles"
];

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ error, saved }, data] = await Promise.all([searchParams, getSettingsData()]);
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");

  return (
    <>
      <PageHeader
        action={<Button href="/settings/billing" variant="secondary">Billing</Button>}
        description="Control organization identity, users, sending domains, timezone, and operational defaults."
        eyebrow="Admin"
        title="Settings"
      />

      {error ? <Notice tone="error">{decodeURIComponent(error)}</Notice> : null}
      {saved ? <Notice>Settings updated.</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader
            description="This information appears in the app shell, public registration surfaces, and outgoing email defaults."
            title="Organization profile"
          />
          <form action={updateOrganizationSettings} className="grid gap-4 p-5 md:grid-cols-2">
            <SectionTitle icon={<Settings2 className="h-4 w-4" />} title="Workspace identity" />
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Organization name
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.name} name="name" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Public slug
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.slug} name="slug" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Logo URL
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.logo_url ?? ""} name="logo_url" placeholder="https://..." type="url" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Brand color
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.primary_color ?? "#ffca3a"} name="primary_color" type="color" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Website
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.website_url ?? ""} name="website_url" placeholder="https://example.org" type="url" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Timezone
              <select className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.timezone} name="timezone">
                {timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink md:col-span-2">
              Address
              <textarea className="min-h-24 rounded-xl border border-line bg-field px-3 py-3 outline-none focus:border-moss" defaultValue={data.org.address ?? ""} name="address" />
            </label>

            <SectionTitle icon={<MailCheck className="h-4 w-4" />} title="Default sender" />
            <label className="grid gap-2 text-sm font-semibold text-ink">
              From name
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.sender_name ?? data.org.name} name="sender_name" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              From email
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.sender_email ?? ""} name="sender_email" placeholder="news@updates.example.org" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink md:col-span-2">
              Reply-to email
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={data.org.reply_to_email ?? ""} name="reply_to_email" type="email" />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Save organization settings</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader description="Send invite links, assign roles, and let teammates accept with their own account." title="Team access" />
            <form action={inviteTeamMember} className="grid gap-3 border-b border-line/80 p-5 sm:grid-cols-[1fr_8rem_auto]">
              <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" name="email" placeholder="teammate@example.org" type="email" required />
              <select className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit">Add seat</Button>
            </form>
            <div className="space-y-3 p-5">
              {data.members.map((member) => (
                <div className="flex items-center justify-between rounded-2xl border border-line bg-field/70 px-3 py-3" key={member.id}>
                  <div>
                    <p className="text-sm font-semibold text-ink">{member.users?.name ?? member.users?.email ?? "User"}</p>
                    <p className="text-xs text-muted">{member.users?.email}</p>
                  </div>
                  <Badge tone={member.role === "admin" ? "green" : "gray"}>{member.role}</Badge>
                </div>
              ))}
              {data.invitations.map((invite) => (
                <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-3 py-3" key={invite.id}>
                  <div>
                    <p className="text-sm font-semibold text-ink">{invite.email}</p>
                    <p className="text-xs text-muted">
                      {invite.status === "pending" ? `Pending until ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(invite.expires_at))}` : `Invitation ${invite.status}`}
                    </p>
                    {invite.status === "pending" ? (
                      <a className="mt-1 inline-flex text-xs font-semibold text-moss hover:text-ink" href={`${appBaseUrl}/team/invite/${invite.token}`}>
                        Open invite link
                      </a>
                    ) : null}
                  </div>
                  <Badge tone="amber">{invite.role}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden">
        <CardHeader
          description="Create a Resend sending domain, publish the DNS records, then verify before using custom from-addresses."
          title="Sender domain verification"
        />
        <form action={createSenderDomain} className="grid gap-3 border-b border-line/80 p-5 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Sending domain or subdomain
            <input className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" name="domain" placeholder="updates.example.org" required />
          </label>
          <div className="flex items-end">
            <Button type="submit"><Globe2 className="h-4 w-4" />Add domain</Button>
          </div>
        </form>
        <div className="space-y-4 p-5">
          {data.domains.length > 0 ? data.domains.map((domain) => {
            const verifyAction = verifySenderDomain.bind(null, domain.id);
            const removeAction = removeSenderDomain.bind(null, domain.id);

            return (
              <div className="rounded-2xl border border-line bg-field/60 p-4" key={domain.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">{domain.domain}</h3>
                      <Badge tone={domain.status === "verified" ? "green" : domain.status === "failed" ? "coral" : "amber"}>{domain.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">Resend domain ID: {domain.resend_domain_id ?? "Not connected"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={verifyAction}><Button type="submit" variant="secondary">Verify DNS</Button></form>
                    <form action={removeAction}><Button className="text-coral" type="submit" variant="ghost">Remove</Button></form>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-[#f7f4eb] text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted">
                      <tr>
                        <th className="px-3 py-2">Record</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Value</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {domain.records.length > 0 ? domain.records.map((record, index) => (
                        <tr key={`${record.name}-${index}`}>
                          <td className="px-3 py-2 font-semibold text-ink">{record.record ?? "DNS"}</td>
                          <td className="px-3 py-2 text-muted">{record.type}</td>
                          <td className="px-3 py-2 text-muted">{record.name}</td>
                          <td className="max-w-md px-3 py-2 font-mono text-xs text-muted">{record.value}</td>
                          <td className="px-3 py-2"><Badge tone={record.status === "verified" ? "green" : "gray"}>{record.status ?? "pending"}</Badge></td>
                        </tr>
                      )) : (
                        <tr><td className="px-3 py-6 text-center text-muted" colSpan={5}>No DNS records returned yet. Recreate or verify the domain after Resend is configured.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-dashed border-line bg-field/70 p-6 text-sm leading-6 text-muted">
              No sender domains yet. Add a domain before using custom from-addresses in campaigns.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 md:col-span-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-amber">{icon}</span>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
    </div>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === "error" ? "border-[#f3c2b8] bg-[#fff0ed] text-coral" : "border-[#d7e9d9] bg-[#edf7f0] text-moss"}`}>
      {children}
    </p>
  );
}
