import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NewEventPage() {
  return (
    <>
      <PageHeader description="The first event form will start with single events, then expand to recurring and multi-location flows." eyebrow="Events" title="New event" />
      <Card className="max-w-3xl p-5">
        <form className="grid gap-4">
          {["Title", "Description", "Location", "Capacity"].map((label) => (
            <label className="space-y-2 text-sm font-medium text-ink" key={label}>
              <span>{label}</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" placeholder={label} />
            </label>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Starts at</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" type="datetime-local" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Ends at</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" type="datetime-local" />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button">Save draft</Button>
            <Button href="/events" variant="secondary">Cancel</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
