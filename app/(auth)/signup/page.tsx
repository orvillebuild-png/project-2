import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Start workspace</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Create your organization</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Supabase auth and org creation will be wired into this form during Phase 1.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          {["Your name", "Work email", "Password", "Organization name", "Organization slug"].map((label) => (
            <label className="space-y-2 text-sm font-medium text-ink" key={label}>
              <span>{label}</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" placeholder={label} type={label === "Password" ? "password" : "text"} />
            </label>
          ))}
          <div className="flex items-end">
            <Button className="w-full" type="button">Create account</Button>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account? <Link className="font-semibold text-moss" href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
