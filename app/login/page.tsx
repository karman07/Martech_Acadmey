"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signInWithEmail, signInWithGoogle, signOutUser, friendlyAuthError } from "@/lib/firebase/auth";
import Button from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const notAdmin = !loading && firebaseUser && profile && profile.role !== "admin";

  useEffect(() => {
    if (!loading && firebaseUser && profile?.role === "admin") {
      router.replace("/");
    }
  }, [loading, firebaseUser, profile, router]);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="manga-border w-full max-w-sm rounded-2xl bg-surface p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-base font-bold text-on-accent">
            M
          </span>
          <span className="font-sans text-lg font-bold">
            Admin
            <span className="block text-xs font-medium text-muted">Martech Academy</span>
          </span>
        </div>

        <h1 className="mt-6 font-sans text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Admin access only.</p>

        {notAdmin && (
          <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-sm text-red-600 dark:text-red-400">
            This account doesn&apos;t have admin access.
            <button
              type="button"
              onClick={() => signOutUser()}
              className="ml-1 font-semibold underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="mt-6 flex flex-col gap-3.5">
          <div>
            <label htmlFor="email" className="text-xs font-semibold text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" loading={submitting} className="mt-1.5 w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="secondary" onClick={handleGoogleSignIn} loading={submitting} className="mt-5 w-full">
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
