"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function KycDocThumb({ userUid, docType, label }: { userUid: string; docType: string; label: string }) {
  const { apiFetch } = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    apiFetch(`/admin/kyc/${userUid}/${docType}`)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid, docType]);

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-1.5"
    >
      <span className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-background-soft">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        )}
      </span>
      <span className="text-[11px] font-medium text-muted">{label}</span>
    </a>
  );
}
