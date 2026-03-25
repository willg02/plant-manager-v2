"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="h-4 w-4 rounded-full bg-border animate-pulse" />
        {!collapsed && <span className="h-3 w-12 rounded bg-border animate-pulse" />}
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : ""}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative h-4 w-4 flex-shrink-0">
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
            isDark ? "rotate-0 opacity-100 scale-100" : "rotate-90 opacity-0 scale-75"
          }`}
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
            isDark ? "-rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
          }`}
        />
      </div>
      {!collapsed && (
        <span className="transition-opacity duration-200">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
