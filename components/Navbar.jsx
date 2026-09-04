"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  CheckSquare,
  ShieldCheck,
  LogOut,
  User,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-zinc-900 dark:text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <CheckSquare className="h-5 w-5 stroke-[2.2]" />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {!loading && user && (
            <>
              {/* Only show My Tasks for non-admin users */}
              {user.role !== "admin" && (
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                    pathname === "/dashboard"
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>My Tasks</span>
                </Link>
              )}

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                    pathname === "/admin"
                      ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                      : "text-purple-600 hover:bg-purple-50/70 dark:text-purple-400 dark:hover:bg-purple-950/20"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Auth status & Actions */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* User Pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {user.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
                </div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
                  {user.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{loggingOut ? "Exiting..." : "Logout"}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {pathname !== "/login" && (
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  Sign In
                </Link>
              )}
              {pathname !== "/register" && (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-500"
                >
                  <span>Sign Up</span>
                </Link>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
