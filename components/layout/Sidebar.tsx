import {
  CalendarDays,
  CreditCard,
  Home,
  Image,
  Mail,
  Settings,
  UsersRound
} from "lucide-react";
import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/contacts", label: "Contacts", icon: UsersRound },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/cards", label: "Cards", icon: Image },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-line bg-white/82 px-4 py-5 backdrop-blur lg:block">
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss text-sm font-bold text-white">
          P2
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">Project 2</span>
          <span className="block text-xs text-muted">Nonprofit SaaS</span>
        </span>
      </Link>

      <nav className="mt-8 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-field hover:text-ink"
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
