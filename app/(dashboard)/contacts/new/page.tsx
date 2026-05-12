import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authMessage } from "@/lib/auth-messages";
import { createContact, listContactTypes } from "@/lib/contacts";

export default async function NewContactPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = authMessage(error) ?? (error ? decodeURIComponent(error) : null);
  const contactTypes = await listContactTypes();

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
            <span>Salutation</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="salutation" placeholder="Ms., Dr., Rev." />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Contact type</span>
            <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="contact_type_id">
              <option value="">None</option>
              {contactTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </label>
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
            <span>Alternate email</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="alternate_email" placeholder="alternate@example.org" type="email" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Alternate phone</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="alternate_phone" placeholder="+63..." />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
            <span>Organization / account</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="organization_name" placeholder="Partner foundation, company, household, or account" />
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
          <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
            <span>Address line 1</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="address_line1" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
            <span>Address line 2</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="address_line2" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>City</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="city" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>State / province</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="state_province" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Postal code</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="postal_code" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Country</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="country" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink md:col-span-2">
            <span>Source</span>
            <input name="source" type="hidden" value="Manual Entry" />
            <input className="h-11 w-full rounded-md border border-line px-3 outline-none" disabled value="Manual Entry" />
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
