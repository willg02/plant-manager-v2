"use client";

import { useState } from "react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  MessageCircle,
  Store,
  Search,
  Settings,
  Menu,
  X,
  Paintbrush,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/plants", label: "Plants", icon: Search },
  { href: "/suppliers", label: "Suppliers", icon: Store },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/design", label: "Design", icon: Paintbrush },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();
  const isAdmin =
    (user?.publicMetadata as { role?: string })?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="group/sidebar fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out hover:w-56 md:flex">

        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center border-b border-border px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span
              className="whitespace-nowrap text-sm font-semibold text-foreground opacity-0 transition-all duration-200 group-hover/sidebar:opacity-100"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Plant<span className="text-[color:var(--zen-accent)]">Manager</span>
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1 overflow-hidden p-2 pt-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {/* Active bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[color:var(--zen-accent)]" />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                pathname.startsWith("/admin")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {pathname.startsWith("/admin") && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[color:var(--zen-accent)]" />
              )}
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:opacity-100">
                Admin
              </span>
            </Link>
          )}
        </nav>

        {/* Bottom: theme toggle + user */}
        <div className="flex flex-col gap-1 border-t border-border p-2 pb-4">
          <ThemeToggle collapsed={true} />
          {/* collapsed prop not quite right for the icon-only sidebar — we override below */}
          <div className="flex items-center gap-3 overflow-hidden px-3 py-2">
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="flex-shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90">
                  <span className="hidden group-hover/sidebar:inline">Sign In</span>
                  <span className="group-hover/sidebar:hidden">→</span>
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Plant<span className="text-[color:var(--zen-accent)]">Manager</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-md md:hidden">
          {/* Close button */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <span
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Plant<span className="text-[color:var(--zen-accent)]">Manager</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-1 flex-col justify-center gap-2 px-6">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span className="h-5 w-0.5 rounded-full bg-[color:var(--zen-accent)]" />
                  )}
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                Admin
              </Link>
            )}
          </nav>

          {/* Bottom */}
          <div className="border-t border-border px-6 py-6 flex items-center justify-between">
            <ThemeToggle />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Sign In
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="md:ml-16">{children}</main>
    </div>
  );
}
