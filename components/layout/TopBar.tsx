import Link from "next/link";
import { Bell, Home, Search } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

export function TopBar({
  orgName,
  userEmail
}: {
  orgName?: string;
  userEmail?: string;
}) {
  return (
    <header className="sticky top-0 z-10 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-2 rounded-full border border-white/70 bg-white/78 px-2.5 py-2 shadow-soft ring-1 ring-ink/5 md:gap-4 md:px-3">
        <Link
          aria-label="Home"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night text-white transition hover:bg-[#2a2925] lg:hidden"
          href="/dashboard"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div className="hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-line/70 bg-field/80 px-3 text-[0.82rem] text-muted sm:flex md:max-w-md">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search contacts, events, campaigns</span>
        </div>
        <button
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-white text-muted transition hover:bg-field hover:text-ink"
          type="button"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-[0.86rem] font-semibold text-ink">{orgName ?? "Workspace"}</p>
          <p className="truncate text-xs text-muted">{userEmail ?? "Signed in"}</p>
        </div>
        <form action={logout} className="shrink-0">
          <button className="h-9 rounded-full border border-line/70 bg-white px-3 text-[0.82rem] font-semibold text-muted transition hover:bg-field hover:text-ink" type="submit">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
