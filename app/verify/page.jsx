"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowRight } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function handleVerify(e) {
    e.preventDefault();
    if (!email) {
      setError("Email is missing. Please register again.");
      return;
    }

    if (code.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Verification failed");
        return;
      }

      setSuccess("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError("Something went wrong. Please check your network.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || resending || !email) return;

    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to resend code");
        return;
      }

      setSuccess("A new 6-digit code has been sent!");
      setResendCooldown(45);
    } catch (err) {
      setError("Network error while resending code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
          <KeyRound className="h-6 w-6 stroke-[2.2]" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Verify Email Address
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          We sent a 6-digit verification code to:
        </p>
        <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
          {email || "your email"}
        </p>
      </div>

      {/* Card container */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-9">
        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* OTP Code input */}
          <div>
            <label className="block text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] rounded-xl border border-zinc-300 bg-zinc-50/50 py-3 text-zinc-900 placeholder-zinc-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder-zinc-600 dark:focus:bg-zinc-800 dark:focus:border-indigo-400"
            />
          </div>

          {/* Verify button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
          >
            <span>{loading ? "Verifying..." : "Verify & Activate Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Resend OTP Section */}
        <div className="mt-6 flex flex-col items-center justify-center border-t border-zinc-100 pt-5 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>Didn&apos;t receive the code or did it expire?</p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || resending}
            className="mt-2 inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
          >
            <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
            <span>
              {resending
                ? "Resending..."
                : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend Code"}
            </span>
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Wrong email address?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Register with another email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}