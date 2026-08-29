"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import { formatDate } from "@/lib/format";

type UserRow = {
  uid: string;
  name: string;
  email: string | null;
  role: "student" | "teacher" | "admin";
  phoneVerified: boolean;
  createdAt: string;
  kyc: { status: string } | null;
};

const ROLE_TABS: ("all" | UserRow["role"])[] = ["all", "student", "teacher", "admin"];

export default function UsersPage() {
  const router = useRouter();
  const { apiFetch } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [role, setRole] = useState<(typeof ROLE_TABS)[number]>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/users${role === "all" ? "" : `?role=${role}`}`)
      .then((res) => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [apiFetch, role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="font-sans text-3xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-muted">Every account on the platform.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ROLE_TABS.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              role === r ? "bg-accent text-on-accent" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background-soft text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Phone verified</th>
              <th className="px-5 py-3 font-semibold">KYC</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  Nothing here.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr
                key={user.uid}
                onClick={() => router.push(`/users/${user.uid}`)}
                className="cursor-pointer transition-colors hover:bg-background-soft"
              >
                <td className="px-5 py-4 font-medium">{user.name}</td>
                <td className="px-5 py-4 text-muted">{user.email}</td>
                <td className="px-5 py-4 capitalize text-muted">{user.role}</td>
                <td className="px-5 py-4 text-muted">{user.phoneVerified ? "Yes" : "No"}</td>
                <td className="px-5 py-4">{user.kyc ? <Badge status={user.kyc.status} /> : <span className="text-muted">—</span>}</td>
                <td className="px-5 py-4 text-muted">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
