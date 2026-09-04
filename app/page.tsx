import Link from "next/link";
import {
  CheckSquare,
  ShieldCheck,
  KeyRound,
  Layers,
  ArrowRight,
  Lock,
  UserCheck,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 w-full bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
            <ShieldCheck className="h-4 w-4" />
            <span>Next.js 16 + MongoDB + Role-Based Auth</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl md:text-7xl">
            Streamlined Tasks.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Enterprise Control.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            A full-stack application with email OTP verification, server-enforced task management for users, and a dedicated admin moderation portal.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Sign Up</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-7 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>Sign In</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-6 py-3.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            >
              <Layers className="h-4 w-4" />
              <span>Go to Tasks</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="border-t border-zinc-200/80 bg-zinc-50/50 py-16 dark:border-zinc-800/80 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Built with Modern Standards & Strict Security
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Designed around reliable data isolation, stateful deactivation enforcement, and rich UI feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                Email OTP Verification
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                6-digit hashed OTPs sent via Nodemailer with attempt limits (max 5) and expiration safeguards before creating verified users.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                User Task Management
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Full CRUD capability with priorities (Low/Med/High), status tracking (Pending/In-Progress/Completed), due dates, and search filters.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                Admin User Moderation
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Admins view standard users, toggle activation status (instantly invalidating sessions), and delete accounts with cascade task cleanup.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
