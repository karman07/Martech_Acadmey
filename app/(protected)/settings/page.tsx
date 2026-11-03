"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Button from "@/components/Button";

type RazorpaySettings = {
  keyId: string | null;
  keySecretConfigured: boolean;
  keySecretPreview: string | null;
  webhookSecretConfigured: boolean;
  webhookSecretPreview: string | null;
  usingEnvFallback: boolean;
  updatedAt: string | null;
};

type ResendSettings = {
  keyConfigured: boolean;
  keyPreview: string | null;
  fromEmail: string | null;
  usingEnvFallback: boolean;
  updatedAt: string | null;
};

type PayoutSettings = {
  upiId: string | null;
  accountName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  updatedAt: string | null;
};

export default function SettingsPage() {
  const { apiFetch } = useAuth();
  const [settings, setSettings] = useState<RazorpaySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [resendSettings, setResendSettings] = useState<ResendSettings | null>(null);
  const [resendLoading, setResendLoading] = useState(true);
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFromEmail, setResendFromEmail] = useState("");
  const [resendSaving, setResendSaving] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSaved, setResendSaved] = useState(false);

  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSaved, setPayoutSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/settings/razorpay")
      .then((res) => res.json())
      .then((data: RazorpaySettings) => {
        setSettings(data);
        setKeyId(data.keyId ?? "");
      })
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const loadResend = useCallback(() => {
    setResendLoading(true);
    apiFetch("/admin/settings/resend")
      .then((res) => res.json())
      .then((data: ResendSettings) => {
        setResendSettings(data);
        setResendFromEmail(data.fromEmail ?? "");
      })
      .finally(() => setResendLoading(false));
  }, [apiFetch]);

  const loadPayout = useCallback(() => {
    setPayoutLoading(true);
    apiFetch("/admin/settings/payout")
      .then((res) => res.json())
      .then((data: PayoutSettings) => {
        setPayoutSettings(data);
        setUpiId(data.upiId ?? "");
        setAccountName(data.accountName ?? "");
        setAccountNumber(data.accountNumber ?? "");
        setIfsc(data.ifsc ?? "");
      })
      .finally(() => setPayoutLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    load();
    loadResend();
    loadPayout();
  }, [load, loadResend, loadPayout]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, string> = { keyId };
      // Only send secrets the admin actually typed something new into — an
      // untouched field means "leave the existing saved value alone".
      if (keySecret) body.keySecret = keySecret;
      if (webhookSecret) body.webhookSecret = webhookSecret;

      const res = await apiFetch("/admin/settings/razorpay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not save your keys. Please try again.");
      const data: RazorpaySettings = await res.json();
      setSettings(data);
      setKeySecret("");
      setWebhookSecret("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your keys.");
    } finally {
      setSaving(false);
    }
  }

  async function saveResend() {
    setResendSaving(true);
    setResendError(null);
    setResendSaved(false);
    try {
      const body: Record<string, string> = { fromEmail: resendFromEmail };
      if (resendApiKey) body.apiKey = resendApiKey;

      const res = await apiFetch("/admin/settings/resend", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not save your email settings. Please try again.");
      const data: ResendSettings = await res.json();
      setResendSettings(data);
      setResendApiKey("");
      setResendSaved(true);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Could not save your email settings.");
    } finally {
      setResendSaving(false);
    }
  }

  async function savePayout() {
    setPayoutSaving(true);
    setPayoutError(null);
    setPayoutSaved(false);
    try {
      const res = await apiFetch("/admin/settings/payout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId, accountName, accountNumber, ifsc }),
      });
      if (!res.ok) throw new Error("Could not save your payout details. Please try again.");
      const data: PayoutSettings = await res.json();
      setPayoutSettings(data);
      setPayoutSaved(true);
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : "Could not save your payout details.");
    } finally {
      setPayoutSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-sans text-3xl font-bold">Settings</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Payment provider and email credentials. Saved values take effect immediately — no server restart
        needed.
      </p>

      <div className="mt-6 max-w-xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-sans text-lg font-bold">Razorpay</h2>
        <p className="mt-1 text-sm text-muted">
          Required for course, ebook, bundle, and bootcamp checkout to work. Get these from your{" "}
          <a
            href="https://dashboard.razorpay.com/app/keys"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            Razorpay dashboard
          </a>
          .
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : (
          <>
            {settings?.usingEnvFallback && (
              <p className="mt-4 rounded-xl border border-accent/25 bg-accent-soft px-3.5 py-2.5 text-xs text-accent">
                Currently running on a key set in the server&apos;s environment variables. Saving here will
                take over.
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {saved && !error && (
              <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-3 text-sm text-accent">
                Saved.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted">Key ID</label>
                <input
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_live_..."
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Key secret</label>
                <input
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  type="password"
                  placeholder={
                    settings?.keySecretConfigured ? `Saved (${settings.keySecretPreview}) — leave blank to keep` : "Not set"
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Webhook secret</label>
                <input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  type="password"
                  placeholder={
                    settings?.webhookSecretConfigured
                      ? `Saved (${settings.webhookSecretPreview}) — leave blank to keep`
                      : "Not set"
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <Button onClick={save} loading={saving} size="sm" className="mt-6">
              Save
            </Button>

            {settings?.updatedAt && (
              <p className="mt-3 text-xs text-muted">
                Last updated {new Date(settings.updatedAt).toLocaleString()}.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-sans text-lg font-bold">Email (Resend)</h2>
        <p className="mt-1 text-sm text-muted">
          Powers enrollment and payment notification emails to students, teachers, and admins. Get an API
          key from your{" "}
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            Resend dashboard
          </a>
          . Without a verified sending domain, Resend only delivers from its sandbox address to the email
          that owns your Resend account — verify a domain in Resend and set a From address below once you
          have one, so real students and teachers actually receive these emails.
        </p>

        {resendLoading ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : (
          <>
            {resendSettings?.usingEnvFallback && (
              <p className="mt-4 rounded-xl border border-accent/25 bg-accent-soft px-3.5 py-2.5 text-xs text-accent">
                Currently running on a key set in the server&apos;s environment variables. Saving here will
                take over.
              </p>
            )}

            {resendError && (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {resendError}
              </div>
            )}
            {resendSaved && !resendError && (
              <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-3 text-sm text-accent">
                Saved.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted">API key</label>
                <input
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  type="password"
                  placeholder={
                    resendSettings?.keyConfigured
                      ? `Saved (${resendSettings.keyPreview}) — leave blank to keep`
                      : "re_..."
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">From address</label>
                <input
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  placeholder="notifications@yourdomain.com (leave blank to use Resend's sandbox address)"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <Button onClick={saveResend} loading={resendSaving} size="sm" className="mt-6">
              Save
            </Button>

            {resendSettings?.updatedAt && (
              <p className="mt-3 text-xs text-muted">
                Last updated {new Date(resendSettings.updatedAt).toLocaleString()}.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-sans text-lg font-bold">Payout details</h2>
        <p className="mt-1 text-sm text-muted">
          Where the platform&apos;s own commission should be paid out to. Reference information only —
          shown here for your own records, not used by any automated payout yet.
        </p>

        {payoutLoading ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : (
          <>
            {payoutError && (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {payoutError}
              </div>
            )}
            {payoutSaved && !payoutError && (
              <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-3 text-sm text-accent">
                Saved.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted">UPI ID</label>
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Account holder name</label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="As it appears on your bank account"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Account number</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">IFSC code</label>
                <input
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="ABCD0123456"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm uppercase outline-none focus:border-accent"
                />
              </div>
            </div>

            <Button onClick={savePayout} loading={payoutSaving} size="sm" className="mt-6">
              Save
            </Button>

            {payoutSettings?.updatedAt && (
              <p className="mt-3 text-xs text-muted">
                Last updated {new Date(payoutSettings.updatedAt).toLocaleString()}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
