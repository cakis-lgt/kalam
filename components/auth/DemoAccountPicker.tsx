"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/auth/demo-accounts";
import { isAuthConfigured } from "@/lib/auth/config";

const ROLE_STYLE: Record<
  DemoRole,
  { border: string; bg: string; dot: string }
> = {
  candidate: {
    border: "border-primary/25 hover:border-primary/45",
    bg: "hover:bg-primary-container/40",
    dot: "bg-primary",
  },
  examiner: {
    border: "border-[#7c3aed]/25 hover:border-[#7c3aed]/45",
    bg: "hover:bg-[#f3e8ff]",
    dot: "bg-[#7c3aed]",
  },
  admin: {
    border: "border-[#0d4f63]/25 hover:border-[#0d4f63]/45",
    bg: "hover:bg-[#e6f2f5]",
    dot: "bg-[#0d4f63]",
  },
};

export function DemoAccountPicker() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authReady = isAuthConfigured();

  async function loginAs(role: DemoRole) {
    setLoadingRole(role);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        setError(data.error ?? "Demo sign-in failed");
        return;
      }
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <div className="mt-6 border-t border-border-light pt-6">
      <div className="mb-3 text-center">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-ink-faint">
          Demo accounts
        </p>
        <p className="mt-1 text-[12.5px] text-ink-subtle">
          {authReady
            ? "Quick sign-in as one of these roles (requires demo account seed)"
            : "Without Supabase — go straight to the role panel"}
        </p>
      </div>

      {error && (
        <div
          className="mb-3 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-xs text-on-error-container"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map((account) => {
          const style = ROLE_STYLE[account.role];
          const busy = loadingRole === account.role;
          return (
            <button
              key={account.role}
              type="button"
              disabled={loadingRole !== null}
              onClick={() => void loginAs(account.role)}
              className={`rounded-[10px] border bg-white px-2 py-3 text-center transition-colors disabled:opacity-60 ${style.border} ${style.bg}`}
            >
              <span
                className={`mx-auto mb-1.5 block h-2 w-2 rounded-full ${style.dot}`}
              />
              <span className="block text-[13px] font-semibold text-ink">
                {busy ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  account.label
                )}
              </span>
              <span className="mt-0.5 block text-[10.5px] leading-tight text-ink-faint">
                {account.hint}
              </span>
            </button>
          );
        })}
      </div>

      {authReady && (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
          Email:{" "}
          <code className="text-ink-subtle">peserta@demo.kalam.app</code> ·{" "}
          <code className="text-ink-subtle">penguji@demo.kalam.app</code> ·{" "}
          <code className="text-ink-subtle">admin@demo.kalam.app</code>
          <br />
          Password: <code className="text-ink-subtle">DemoKalam1!</code> · Run{" "}
          <code className="text-ink-subtle">npm run seed:demo</code>
        </p>
      )}
    </div>
  );
}
