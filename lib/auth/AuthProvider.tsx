"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export type UserProfile = {
  uid: string;
  email: string | null;
  name: string;
  role: "student" | "teacher" | "admin" | "sales";
  avatarPath?: string | null;
  [key: string]: unknown;
};

export function avatarUrl(profile: UserProfile | null | undefined): string | null {
  if (!profile?.avatarPath) return null;
  return `${API_BASE_URL}/public/${profile.avatarPath}`;
}

/** Builds a full URL for any uploaded file under uploads-public (cover images, banner assets, etc). */
export function publicFileUrl(storagePath: string): string {
  return `${API_BASE_URL}/public/${storagePath}`;
}

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_TIMEOUT_MS = 20000;

/** Rejects if `promise` hasn't settled within `ms` — without this, a hung token refresh or network call leaves callers (and their loading state) stuck forever. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      const currentUser = auth.currentUser;

      if (currentUser) {
        const token = await withTimeout(
          currentUser.getIdToken(),
          API_TIMEOUT_MS,
          "Timed out while refreshing your sign-in. Please try again.",
        );
        headers.set("Authorization", `Bearer ${token}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      try {
        return await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("The request timed out. Please check your connection and try again.");
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    const response = await apiFetch("/users/me");

    if (response.status === 404) {
      setProfile(null);
      return;
    }

    if (response.ok) {
      setProfile((await response.json()) as UserProfile);
    }
  }, [apiFetch]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        await refreshProfile();
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, loading, refreshProfile, apiFetch }),
    [firebaseUser, profile, loading, refreshProfile, apiFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
