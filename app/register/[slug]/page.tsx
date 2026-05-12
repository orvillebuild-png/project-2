import { Button } from "@/components/ui/Button";

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">{slug}</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Join this contact list</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Public self-registration will create contacts and auto-apply source tags.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          {["First name", "Last name", "Email", "Phone"].map((label) => (
            <label className="space-y-2 text-sm font-medium text-ink" key={label}>
              <span>{label}</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" placeholder={label} />
            </label>
          ))}
          <Button className="md:col-span-2" type="button">Submit</Button>
        </form>
      </section>
    </main>
  );
}
