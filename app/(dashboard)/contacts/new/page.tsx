import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authMessage } from "@/lib/auth-messages";
import { createContact } from "@/lib/contacts";

export default async function NewContactPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = authMessage(error) ?? (error ? decodeURIComponent(error) : null);

  return (
    <>
      <PageHeader
        description="Add a person to the current workspace. Email validation will attach to this flow in Phase 3."
        eyebrow="CRM"
        title="New contact"
      />
      <Card className="max-w-3xl p-5">
        {message ? (
          <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {message}
          </p>
        ) : null}
        <form action={createContact} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>First name</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="first_name" placeholder="Maria" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Last name</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="last_name" placeholder="Santos" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Email</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="email" placeholder="maria@example.org" required type="email" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Phone</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="phone" placeholder="+63..." />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Source</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="source" placeholder="Manual entry" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Age</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" min="0" name="age" placeholder="32" type="number" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Sex</span>
            <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="sex">
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Save contact</Button>
            <Button href="/contacts" variant="secondary">Cancel</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
