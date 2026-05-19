"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a") : null;

      if (!(target instanceof HTMLAnchorElement) || !target.href || target.target) {
        return;
      }

      const nextUrl = new URL(target.href);

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      if (`${nextUrl.pathname}${nextUrl.search}` === `${window.location.pathname}${window.location.search}`) {
        return;
      }

      setPending(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!pending) {
      return;
    }

    const timeout = window.setTimeout(() => setPending(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return (
    <div
      aria-hidden="true"
      className={`fixed left-0 top-0 z-50 h-1 bg-amber shadow-[0_0_18px_rgba(255,207,74,0.65)] transition-all duration-500 ${
        pending ? "w-3/4 opacity-100" : "w-0 opacity-0"
      }`}
    />
  );
}
