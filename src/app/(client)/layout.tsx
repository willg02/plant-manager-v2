"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Leaf, MessageCircle, Store, Search, Settings } from "lucide-react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const isAdmin = (user?.publicMetadata as { role?: string })?.role === "admin";
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <Leaf className="h-6 w-6" />
              Plant Manager
            </Link>
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/plants"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-green-600"
              >
                <Search className="h-4 w-4" />
                Plants
              </Link>
              <Link
                href="/suppliers"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-green-600"
              >
                <Store className="h-4 w-4" />
                Suppliers
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-md border border-green-500 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-green-600"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-50">
                  Sign In
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
