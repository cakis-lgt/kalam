import type { UserRole } from "@/types/database";

export type DemoRole = Extract<UserRole, "candidate" | "examiner" | "admin">;

export type DemoAccount = {
  role: DemoRole;
  label: string;
  email: string;
  fullName: string;
  institution: string;
  redirect: string;
  hint: string;
};

/** Password bersama untuk semua akun demo (dev/staging). */
export const DEMO_PASSWORD = "DemoKalam1!";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "candidate",
    label: "Candidate",
    email: "peserta@demo.kalam.app",
    fullName: "Ahmad Fauzan",
    institution: "UNIDA Gontor",
    redirect: "/dashboard",
    hint: "Test dashboard & score history",
  },
  {
    role: "examiner",
    label: "Examiner",
    email: "penguji@demo.kalam.app",
    fullName: "Ustadz Fadhil",
    institution: "UNIDA Gontor",
    redirect: "/examiner",
    hint: "Queue & rubric scoring",
  },
  {
    role: "admin",
    label: "Admin",
    email: "admin@demo.kalam.app",
    fullName: "Exam Coordinator",
    institution: "UNIDA Gontor",
    redirect: "/admin",
    hint: "Assign sessions to examiners",
  },
];

export function getDemoAccountByRole(role: DemoRole): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.role === role);
}

export function getDemoAccountByEmail(email: string): DemoAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
}

export function isDemoAccountEmail(email: string): boolean {
  return Boolean(getDemoAccountByEmail(email));
}
