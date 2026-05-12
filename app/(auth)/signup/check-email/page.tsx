import Link from "next/link";
import { resendConfirmation } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { authMessage } from "@/lib/auth-messages";

export default async function CheckEmailPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; status?: string }>;
}) {
  const { email, status } = await searchParams;
  const message = authMessage(status);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Verify email</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          We sent a verification link{email ? ` to ${email}` : ""}. Open it, then return here to log in.
        </p>
        {message ? (
          <p className="mt-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
            {message}
          </p>
        ) : null}
        {email ? (
          <form action={resendConfirmation} className="mt-6">
            <input name="email" type="hidden" value={email} />
            <Button className="w-full" type="submit" variant="secondary">Resend verification email</Button>
          </form>
        ) : null}
        <Button className="mt-3 w-full" href="/login">Go to login</Button>
        <p className="mt-5 text-center text-sm text-muted">
          Wrong email? <Link className="font-semibold text-moss" href="/signup">Create a new account</Link>
        </p>
      </section>
    </main>
  );
}
