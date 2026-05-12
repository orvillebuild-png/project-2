import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Project 2</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Access your nonprofit workspace.</p>
        <form className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Email</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" type="email" />
          </label>
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Password</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" type="password" />
          </label>
          <Button className="w-full" type="button">Log in</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          New organization? <Link className="font-semibold text-moss" href="/signup">Create account</Link>
        </p>
      </section>
    </main>
  );
}
