import { BouncingDots, PulseBlob, SkeletonBlock } from "@/components/ui/Loader";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-soft ring-1 ring-ink/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <PulseBlob className="mt-1 shrink-0" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonLine className="h-3 w-24" />
                <BouncingDots />
              </div>
              <SkeletonLine className="h-8 w-64 max-w-full md:w-96" />
              <SkeletonLine className="h-4 w-52 max-w-full md:w-80" />
            </div>
          </div>
          <SkeletonLine className="h-10 w-32 rounded-full" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SkeletonPanel />
        <SkeletonPanel />
        <SkeletonPanel />
      </div>

      <section className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/82 shadow-soft ring-1 ring-ink/5">
        <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-5 w-36" />
          </div>
          <SkeletonLine className="h-10 w-44 rounded-full" />
        </div>
        <div className="space-y-3 p-5">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </section>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="mt-4 h-8 w-16" />
      <SkeletonLine className="mt-3 h-3 w-32" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid gap-3 rounded-2xl border border-line/70 bg-field/70 p-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.6fr]">
      <SkeletonLine className="h-4 w-40" />
      <SkeletonLine className="h-4 w-52 max-w-full" />
      <SkeletonLine className="h-4 w-28" />
      <SkeletonLine className="h-8 w-20 rounded-full" />
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <SkeletonBlock className={className} />;
}
