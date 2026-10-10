import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { DemoAccountPicker } from "@/components/auth/DemoAccountPicker";

export const metadata: Metadata = {
  title: "Login — ALIKHTIBAR",
  description: "Sign in to your ALIKHTIBAR account for Arabic or English Speaking tests.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to ALIKHTIBAR"
      subtitle="Sign in to continue your test or view your score history."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register now
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <DemoAccountPicker />
    </AuthShell>
  );
}
