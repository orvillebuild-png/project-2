import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NewContactPage() {
  return (
    <>
      <PageHeader
        description="This is the first form surface; it will save to Supabase and trigger email validation in Phase 2/3."
        eyebrow="CRM"
        title="New contact"
      />
      <Card className="max-w-3xl p-5">
        <form className="grid gap-4 md:grid-cols-2">
          {["First name", "Last name", "Email", "Phone", "Source", "Age"].map((label) => (
            <label className="space-y-2 text-sm font-medium text-ink" key={label}>
              <span>{label}</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" placeholder={label} />
            </label>
          ))}
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Sex</span>
            <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss">
              <option>Not specified</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="button">Save contact</Button>
            <Button href="/contacts" variant="secondary">Cancel</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
