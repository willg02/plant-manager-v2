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
    <div className="min-h-screen bg-gray-50/50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600">
              <Leaf className="h-4.5 w-4.5 text-white" />
            </div>
            <span>
              Plant<span className="text-emerald-400">Manager</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/5 px-4 pb-4 sm:hidden">
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-400"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>
    </div>
  );
}
