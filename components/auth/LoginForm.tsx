"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthField } from "./AuthField";
import { loginSchema, type LoginInput } from "@/lib/auth/validation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [lastIdentifier, setLastIdentifier] = useState("");

  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    const error = searchParams.get("error");
    if (confirmed === "1") {
      setFormSuccess("Email confirmed. You can sign in now.");
      setFormError(null);
    } else if (error) {
      setFormError(error);
      setFormSuccess(null);
    }
  }, [searchParams]);

  async function handleResendConfirmation() {
    if (!lastIdentifier.trim()) {
      setFormError("Enter your username or email above, then resend confirmation.");
      return;
    }
    setResending(true);
    setFormSuccess(null);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: lastIdentifier.trim() }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Could not resend confirmation email.");
        return;
      }
      setFormError(null);
      setFormSuccess(data.message ?? "Confirmation email sent.");
    } catch {
      setFormError("Could not connect to the server. Check your connection.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFieldErrors({});
    setNeedsConfirmation(false);

    const formData = new FormData(e.currentTarget);
    const raw = {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
      remember: formData.get("remember") === "on",
    };
    setLastIdentifier(raw.identifier);

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Partial<Record<keyof LoginInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LoginInput;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        error?: string;
        redirect?: string;
        code?: string;
      };

      if (!res.ok) {
        setFormError(data.error ?? "Sign in failed. Please try again.");
        setNeedsConfirmation(data.code === "email_not_confirmed");
        return;
      }

      router.push(data.redirect ?? "/dashboard");
    } catch {
      setFormError("Could not connect to the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formSuccess && (
        <div
          className="mb-3.5 rounded-lg border border-primary/25 bg-primary-container/50 px-4 py-3 text-sm text-primary"
          role="status"
        >
          {formSuccess}
        </div>
      )}

      {formError && (
        <div
          className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
          role="alert"
        >
          {formError}
          {needsConfirmation && (
            <button
              type="button"
              disabled={resending}
              onClick={() => void handleResendConfirmation()}
              className="mt-2 block text-left text-[13px] font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend confirmation email"}
            </button>
          )}
        </div>
      )}

      <AuthField
        name="identifier"
        type="text"
        label="Username or email"
        autoComplete="username"
        placeholder="username or name@unida.gontor.ac.id"
        error={fieldErrors.identifier}
        disabled={loading}
      />

      <AuthField
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={fieldErrors.password}
        disabled={loading}
      />

      <div className="mb-[18px] flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-subtle">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-border-light accent-primary"
            disabled={loading}
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
          className="text-[13px] font-medium text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mb-3.5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-[13px] text-[14.5px] font-semibold text-on-primary transition-colors hover:bg-kalam-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Processing...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
