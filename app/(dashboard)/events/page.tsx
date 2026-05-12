import { ModulePage } from "@/components/layout/ModulePage";

export default function EventsPage() {
  return (
    <ModulePage
      ctaHref="/events/new"
      ctaLabel="New event"
      description="Create single, recurring, and multi-location events with capacity, waitlists, and attendance tracking."
      eyebrow="Events"
      rows={[
        { label: "Single event CRUD", status: "Phase 4", tone: "amber" },
        { label: "Recurring event engine", status: "Phase 4", tone: "amber" },
        { label: "Multi-location events", status: "Phase 4", tone: "amber" },
        { label: "Attendance auto-tags", status: "Phase 4", tone: "amber" }
      ]}
      title="Events"
    />
  );
}
