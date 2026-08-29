"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import DashboardShell from "@/components/DashboardShell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser || !profile || profile.role !== "admin") {
      router.replace("/login");
    }
  }, [loading, firebaseUser, profile, router]);

  if (loading || !firebaseUser || !profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
