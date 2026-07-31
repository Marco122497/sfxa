"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#collections", id: "collections", label: "Collections" },
  { href: "#donations", id: "donations", label: "Donations" },
  { href: "#expenses", id: "expenses", label: "Expenses" },
  { href: "#budget", id: "budget", label: "Budget" },
  { href: "#projects", id: "projects", label: "Projects" },
  { href: "#announcements", id: "announcements", label: "Announcements" },
] as const;

export function TransparencySiteHeader({
  dashboardHref,
}: {
  dashboardHref: string | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("top");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["top", ...NAV.map((item) => item.id)];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.15, 0.4, 0.7],
      }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function scrollToHash(href: string) {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    setMobileOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out",
        scrolled || mobileOpen
          ? "border-b border-[#1c2a20]/10 bg-[#f7f4ef]/92 shadow-[0_8px_30px_rgba(28,42,32,0.08)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.25rem] md:px-6">
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            scrollToHash("#top");
          }}
          className={cn(
            "font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight transition-colors duration-300 md:text-xl",
            scrolled || mobileOpen ? "text-[#1c2a20]" : "text-white"
          )}
        >
          SFXA Finance
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToHash(item.href);
                }}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors duration-300",
                  scrolled
                    ? isActive
                      ? "text-[#1c2a20]"
                      : "text-[#1c2a20]/60 hover:text-[#1c2a20]"
                    : isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-current transition-transform duration-500 ease-out",
                    isActive ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              className={cn(
                buttonVariants({ size: "sm" }),
                "transition-all duration-300",
                scrolled || mobileOpen
                  ? "bg-[#1c2a20] text-[#f7f4ef] hover:bg-[#1c2a20]/90"
                  : "bg-white text-[#1c2a20] hover:bg-white/90"
              )}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "transition-all duration-300",
                scrolled || mobileOpen
                  ? "border-[#1c2a20]/25 bg-transparent text-[#1c2a20]"
                  : "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              )}
            >
              Staff login
            </Link>
          )}

          <button
            type="button"
            className={cn(
              "inline-flex size-9 items-center justify-center md:hidden",
              scrolled || mobileOpen ? "text-[#1c2a20]" : "text-white"
            )}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-300",
                  mobileOpen && "translate-y-[3.5px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-opacity duration-300",
                  mobileOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-300",
                  mobileOpen && "-translate-y-[3.5px] -rotate-45"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-[#1c2a20]/8 transition-[max-height,opacity] duration-500 ease-out md:hidden",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                scrollToHash(item.href);
              }}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm transition-colors",
                active === item.id
                  ? "bg-[#1c2a20]/08 font-medium text-[#1c2a20]"
                  : "text-[#1c2a20]/70 hover:bg-[#1c2a20]/05 hover:text-[#1c2a20]"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
