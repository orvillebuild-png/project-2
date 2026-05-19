"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function CollapsibleRail({
  children,
  label = "Panel"
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`space-y-5 transition-[width] duration-300 xl:sticky xl:top-5 xl:self-start ${
        collapsed ? "xl:w-16" : "xl:w-[25rem]"
      }`}
    >
      <button
        aria-expanded={!collapsed}
        className="mb-2 hidden h-10 w-full items-center justify-center gap-2 rounded-full border border-line bg-white/84 px-3 text-[0.78rem] font-semibold text-muted shadow-sm transition hover:border-moss/40 hover:text-ink xl:inline-flex"
        onClick={() => setCollapsed((value) => !value)}
        type="button"
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className={collapsed ? "sr-only" : ""}>{collapsed ? `Open ${label}` : `Collapse ${label}`}</span>
      </button>
      <div className={collapsed ? "hidden xl:block" : ""}>
        {collapsed ? (
          <button
            className="flex min-h-48 w-full items-center justify-center rounded-[1.4rem] border border-line bg-white/82 text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss shadow-soft [writing-mode:vertical-rl]"
            onClick={() => setCollapsed(false)}
            type="button"
          >
            {label}
          </button>
        ) : children}
      </div>
    </aside>
  );
}
