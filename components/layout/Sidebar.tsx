"use client";

import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  Mail,
  Tags,
  Settings,
  UsersRound
} from "lucide-react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays }
];

const utilityNav = [
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings }
];

const groupedNav = [
  {
    href: "/contacts",
    label: "Contacts",
    icon: UsersRound,
    children: [
      { href: "/contacts/organizations", label: "Organizations", icon: Building2 },
      { href: "/contacts/tags", label: "Tags", icon: Tags }
    ]
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Mail,
    children: [
      { href: "/templates", label: "Email templates", icon: FileText }
    ]
  }
];

export function Sidebar({
  org
}: {
  org?: { logo_url: string | null; name: string } | null;
}) {
  const pathname = usePathname();
  const initials = (org?.name ?? "Project 2")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P2";

  return (
    <aside className="hidden min-h-screen w-[17rem] shrink-0 p-4 lg:block">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[1.65rem] bg-night p-3 text-white shadow-lift">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/8 px-3 py-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-amber text-sm font-black text-night">
            {org?.logo_url ? (
              <img alt={`${org.name} logo`} className="h-full w-full object-cover" src={org.logo_url} />
            ) : initials}
          </span>
          <span>
            <span className="block max-w-[9.5rem] truncate text-sm font-semibold">{org?.name ?? "Project 2"}</span>
            <span className="block text-[0.72rem] text-white/55">Nonprofit OS</span>
          </span>
        </Link>

        <nav className="mt-5 space-y-1.5">
          {primaryNav.map((item) => {
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
          {groupedNav.map((group) => {
            const Icon = group.icon;
            const active = pathname === group.href || pathname.startsWith(`${group.href}/`) || group.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));
            const expanded = active;

            return (
              <div key={group.href}>
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[0.84rem] font-semibold text-white/62 transition",
                    active ? "bg-amber text-night shadow-sm" : "hover:bg-white/10 hover:text-white"
                  )}
                  href={group.href}
                >
                  <Icon className="h-4 w-4" />
                  {group.label}
                </Link>
                {expanded ? (
                  <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {group.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);

                      return (
                        <Link
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-2.5 py-2 text-[0.78rem] font-semibold transition",
                            childActive ? "bg-white/12 text-amber" : "text-white/48 hover:bg-white/8 hover:text-white"
                          )}
                          href={child.href}
                          key={child.href}
                        >
                          <ChildIcon className="h-3.5 w-3.5" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
          {utilityNav.map((item) => {
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
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-amber">Workspace</p>
          <p className="mt-2 text-[0.78rem] leading-5 text-white/60">Contacts, events, campaigns, and sender setup.</p>
        </div>
      </div>
    </aside>
  );
}
