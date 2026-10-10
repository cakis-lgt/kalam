"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthField } from "./AuthField";
import { AuthSelectField } from "./AuthSelectField";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";
import {
  facultySelectOptions,
  GONTOR_INSTITUTION,
  studyProgramSelectOptions,
} from "@/lib/profile/candidate-fields";

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterInput | "acceptTerms", string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [faculty, setFaculty] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const raw = {
      username: String(formData.get("username") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      nim: String(formData.get("nim") ?? ""),
      faculty: String(formData.get("faculty") ?? ""),
      studyProgram: String(formData.get("studyProgram") ?? ""),
      semester: formData.get("semester"),
      acceptTerms: formData.get("acceptTerms") === "on",
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Partial<
        Record<keyof RegisterInput | "acceptTerms", string>
      > = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RegisterInput | "acceptTerms";
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        redirect?: string;
      };

      if (!res.ok) {
        setFormError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      if (data.redirect) {
        router.push(data.redirect);
        return;
      }

      setSuccess(true);
    } catch {
      setFormError("Could not connect to the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-headline-lg-mobile font-semibold text-primary">
          Check your email
        </h2>
        <p className="text-body-md text-on-surface-variant">
          We sent a verification link. After you verify your email, you can sign
          in with your username or email and start the test.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container hover:text-on-primary-container"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div
          className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
          role="alert"
        >
          {formError}
        </div>
      )}

      <p className="mb-4 rounded-lg border border-primary/20 bg-primary-container/40 px-3 py-2 text-[12.5px] text-ink-muted">
        Registration for {GONTOR_INSTITUTION} students. All fields are required.
      </p>

      <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-3">
        <AuthField
          name="username"
          type="text"
          label="Username"
          autoComplete="username"
          placeholder="e.g. ahmad.fauzan"
          error={fieldErrors.username}
          disabled={loading}
        />

        <AuthField
          name="nim"
          type="text"
          label="NIM"
          inputMode="numeric"
          placeholder="Student ID number"
          error={fieldErrors.nim}
          disabled={loading}
        />
      </div>

      <AuthField
        name="fullName"
        type="text"
        label="Full name"
        autoComplete="name"
        placeholder="e.g. Ahmad Fauzan"
        error={fieldErrors.fullName}
        disabled={loading}
      />

      <AuthField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="name@unida.gontor.ac.id"
        error={fieldErrors.email}
        disabled={loading}
      />

      <AuthSelectField
        name="faculty"
        label="Faculty"
        placeholder="Select faculty"
        options={facultySelectOptions()}
        error={fieldErrors.faculty}
        disabled={loading}
        value={faculty}
        onChange={(e) => setFaculty(e.target.value)}
      />

      <AuthSelectField
        key={faculty || "no-faculty"}
        name="studyProgram"
        label="Study program"
        placeholder={
          faculty ? "Select study program" : "Select a faculty first"
        }
        options={studyProgramSelectOptions(faculty)}
        error={fieldErrors.studyProgram}
        disabled={loading || !faculty}
        defaultValue=""
      />

      <AuthSelectField
        name="semester"
        label="Semester"
        placeholder="Select semester"
        options={SEMESTER_OPTIONS}
        error={fieldErrors.semester}
        disabled={loading}
        defaultValue=""
      />

      <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-3">
        <AuthField
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={fieldErrors.password}
          disabled={loading}
        />

        <AuthField
          name="confirmPassword"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat password"
          error={fieldErrors.confirmPassword}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-label-sm text-on-surface-variant">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary/30"
            disabled={loading}
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {fieldErrors.acceptTerms && (
          <p className="text-[13px] text-error" role="alert">
            {fieldErrors.acceptTerms}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-[13px] text-[14.5px] font-semibold text-on-primary transition-colors hover:bg-kalam-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>

      <p className="border-t border-outline-variant pt-4 text-center text-[13px] text-on-surface-variant">
        Examiner accounts are by institutional invitation only.{" "}
        <Link href="#" className="text-primary hover:underline">
          Learn more
        </Link>
      </p>
    </form>
  );
}
