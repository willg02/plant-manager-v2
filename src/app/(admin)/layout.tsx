"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Leaf,
  Store,
  Upload,
  MapPin,
  Users,
  Search,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/plants", label: "Plants", icon: Leaf },
  { href: "/admin/suppliers", label: "Suppliers", icon: Store },
  { href: "/admin/upload", label: "Upload", icon: Upload },
  { href: "/admin/scraper", label: "Pike Scraper", icon: Search },
  { href: "/admin/regions", label: "Regions", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="flex h-14 items-center gap-2 border-b border-gray-700 px-4">
          <Leaf className="size-6 text-green-400" />
          <span className="text-lg font-semibold">Plant Manager</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-6">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <UserButton />
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
