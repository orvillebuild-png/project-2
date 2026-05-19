import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { login, resendConfirmation } from "@/app/(auth)/actions";
import { authMessage } from "@/lib/auth-messages";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; email?: string; next?: string }>;
}) {
  const { error, email, next } = await searchParams;
  const message = authMessage(error);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Project 2</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Access your nonprofit workspace.</p>
        {message ? (
          <p className="mt-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {decodeURIComponent(message)}
          </p>
        ) : null}
        {error === "email_not_confirmed" && email ? (
          <form action={resendConfirmation} className="mt-3">
            <input name="email" type="hidden" value={email} />
            <Button className="w-full" type="submit" variant="secondary">Resend verification email</Button>
          </form>
        ) : null}
        <form action={login} className="mt-6 space-y-4">
          <input name="next" type="hidden" value={next ?? "/dashboard"} />
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Email</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="email" required type="email" />
          </label>
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Password</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="password" required type="password" />
          </label>
          <Button className="w-full" type="submit">Log in</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          New organization? <Link className="font-semibold text-moss" href="/signup">Create account</Link>
        </p>
      </section>
    </main>
  );
}
