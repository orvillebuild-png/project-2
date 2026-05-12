import { Bell, Search } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

export function TopBar({
  orgName,
  userEmail
}: {
  orgName?: string;
  userEmail?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-[#fbfaf7]/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-muted md:max-w-md">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search contacts, events, campaigns</span>
        </div>
        <button
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:bg-field hover:text-ink"
          type="button"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-sm font-semibold text-ink">{orgName ?? "Workspace"}</p>
          <p className="truncate text-xs text-muted">{userEmail ?? "Signed in"}</p>
        </div>
        <form action={logout}>
          <button className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-muted transition hover:bg-field hover:text-ink" type="submit">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
