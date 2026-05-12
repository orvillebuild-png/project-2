import { Button } from "@/components/ui/Button";

export default async function RSVPPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">RSVP</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Will you attend?</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Tokenized RSVP page placeholder. Token: {token}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button type="button">Yes</Button>
          <Button type="button" variant="secondary">Maybe</Button>
          <Button type="button" variant="secondary">No</Button>
        </div>
      </section>
    </main>
  );
}
