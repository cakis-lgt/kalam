import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register — ALIKHTIBAR",
  description:
    "Create an ALIKHTIBAR account for Arabic or English speaking assessment (Pre-A1–C2).",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create a new account"
      subtitle="Register as a Universitas Darussalam Gontor student to access the Speaking test."
      contentClassName="max-w-[520px]"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
