"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSelectField } from "@/components/auth/AuthSelectField";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/auth/validation";
import type { CandidateProfilePageData } from "@/lib/dashboard/queries";
import {
  facultySelectOptions,
  studyProgramSelectOptions,
} from "@/lib/profile/candidate-fields";

const SEMESTER_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

type Props = {
  data: CandidateProfilePageData;
};

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-[12.5px] font-semibold text-ink-faint">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value ?? "—"}</dd>
    </div>
  );
}

export function ProfileEditor({ data }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProfileUpdateInput, string>>
  >({});

  const [faculty, setFaculty] = useState(data.faculty ?? "");
  const [studyProgram, setStudyProgram] = useState(data.studyProgram ?? "");

  function startEdit() {
    setFaculty(data.faculty ?? "");
    setStudyProgram(data.studyProgram ?? "");
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setEditing(true);
  }

  function cancelEdit() {
    setFaculty(data.faculty ?? "");
    setStudyProgram(data.studyProgram ?? "");
    setError(null);
    setFieldErrors({});
    setEditing(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = {
      fullName: String(formData.get("fullName") ?? ""),
      username: String(formData.get("username") ?? ""),
      nim: String(formData.get("nim") ?? ""),
      faculty: String(formData.get("faculty") ?? faculty),
      studyProgram: String(formData.get("studyProgram") ?? studyProgram),
      semester: formData.get("semester"),
    };

    const parsed = profileUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Partial<Record<keyof ProfileUpdateInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProfileUpdateInput;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not save profile.");
        return;
      }
      setSuccess("Profile updated successfully.");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-[14px] border border-border bg-white p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-muted">
          {editing ? "Edit profile" : "Account details"}
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-white px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-surface-container"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit profile
          </button>
        )}
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && !editing && (
        <div
          className="mb-4 rounded-lg border border-primary/25 bg-primary-container/50 px-4 py-3 text-sm text-primary"
          role="status"
        >
          {success}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-3">
            <AuthField
              name="fullName"
              label="Full name"
              defaultValue={data.fullName}
              error={fieldErrors.fullName}
              disabled={loading}
            />
            <AuthField
              name="username"
              label="Username"
              defaultValue={data.username ?? ""}
              error={fieldErrors.username}
              disabled={loading}
            />
          </div>

          <div className="mb-3.5">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-secondary">
              Email
            </label>
            <input
              value={data.email}
              disabled
              className="w-full cursor-not-allowed rounded-[10px] border border-border-light bg-surface-dim px-[13px] py-[11px] text-sm text-ink-muted"
            />
            <p className="mt-1 text-[12px] text-ink-faint">
              Email cannot be changed here.
            </p>
          </div>

          <AuthField
            name="nim"
            label="NIM"
            inputMode="numeric"
            defaultValue={data.nim ?? ""}
            error={fieldErrors.nim}
            disabled={loading}
          />

          <AuthSelectField
            name="faculty"
            label="Faculty"
            placeholder="Select faculty"
            options={facultySelectOptions()}
            value={faculty}
            onChange={(e) => {
              setFaculty(e.target.value);
              setStudyProgram("");
            }}
            error={fieldErrors.faculty}
            disabled={loading}
          />

          <AuthSelectField
            key={faculty || "no-faculty"}
            name="studyProgram"
            label="Study program"
            placeholder={
              faculty ? "Select study program" : "Select a faculty first"
            }
            options={studyProgramSelectOptions(faculty)}
            value={studyProgram}
            onChange={(e) => setStudyProgram(e.target.value)}
            error={fieldErrors.studyProgram}
            disabled={loading || !faculty}
          />

          <AuthSelectField
            name="semester"
            label="Semester"
            placeholder="Select semester"
            options={SEMESTER_OPTIONS}
            defaultValue={data.semester ? String(data.semester) : ""}
            error={fieldErrors.semester}
            disabled={loading}
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-on-primary hover:bg-kalam-600 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={cancelEdit}
              className="rounded-[10px] border border-border-light bg-white px-5 py-2.5 text-[13.5px] font-semibold text-ink-muted hover:bg-surface-container disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="Full name" value={data.fullName} />
          <ReadOnlyField
            label="Username"
            value={data.username ? `@${data.username}` : null}
          />
          <ReadOnlyField label="Email" value={data.email} />
          <ReadOnlyField label="NIM" value={data.nim} />
          <ReadOnlyField label="Institution" value={data.institution} />
          <ReadOnlyField label="Faculty" value={data.faculty} />
          <ReadOnlyField label="Study program" value={data.studyProgram} />
          <ReadOnlyField label="Semester" value={data.semester} />
          <ReadOnlyField label="Current ALIKHTIBAR level" value={data.currentLevel} />
        </dl>
      )}

      <Link
        href="/dashboard"
        className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
