"use client";

import {
  CalendarDays,
  CreditCard,
  Home,
  Mail,
  Settings,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/contacts", label: "Contacts", icon: UsersRound },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[17rem] shrink-0 p-4 lg:block">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[1.65rem] bg-night p-3 text-white shadow-lift">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/8 px-3 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber text-sm font-black text-night">
            P2
          </span>
          <span>
            <span className="block text-sm font-semibold">Project 2</span>
            <span className="block text-[0.72rem] text-white/55">Nonprofit OS</span>
          </span>
        </Link>

        <nav className="mt-5 space-y-1.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[0.84rem] font-semibold text-white/62 transition",
                  active ? "bg-amber text-night shadow-sm" : "hover:bg-white/10 hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-amber">Build mode</p>
          <p className="mt-2 text-[0.78rem] leading-5 text-white/60">Design system refresh active.</p>
        </div>
      </div>
    </aside>
  );
}
