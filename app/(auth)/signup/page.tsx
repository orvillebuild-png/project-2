import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { signup } from "@/app/(auth)/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Start workspace</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Create your organization</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Supabase auth and org creation will be wired into this form during Phase 1.</p>
        {error ? (
          <p className="mt-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {decodeURIComponent(error)}
          </p>
        ) : null}
        <form action={signup} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Your name</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="name" required />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Email</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="email" required type="email" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Password</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" minLength={8} name="password" required type="password" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Organization name</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="org_name" required />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Organization slug</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="org_slug" placeholder="your-org" />
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit">Create account</Button>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account? <Link className="font-semibold text-moss" href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
