import Link from "next/link";
import { KalamLogo } from "@/components/ui/KalamLogo";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  contentClassName?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  contentClassName = "max-w-[368px]",
}: Props) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-14 text-slate-100 lg:flex">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-arabic text-[240px] leading-none text-white opacity-[0.07]">
          كلام
        </div>

        <div className="relative">
          <KalamLogo href="/" variant="dark" size="lg" showSubtitle={false} />
        </div>

        <div className="relative">
          <div
            dir="rtl"
            lang="ar"
            className="mb-3.5 font-arabic text-[34px] leading-[1.7]"
          >
            مَنْ جَدَّ وَجَدَ
          </div>
          <p className="max-w-[380px] text-base leading-[1.6] text-slate-300">
            Whoever strives will find success. Show us your speaking ability.
          </p>
        </div>

        <p className="relative text-[12.5px] text-ink-faint">
          ALIKHTIBAR Standard · Human examiner scoring · Secure 14-day recording retention
        </p>
      </aside>

      <div className="flex items-center justify-center bg-page p-10">
        <div className={`w-full ${contentClassName}`}>
          <div className="mb-6 lg:hidden">
            <KalamLogo href="/" />
          </div>

          <h1 className="font-heading text-[27px] font-semibold text-ink">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-subtle">{subtitle}</p>

          <div className="mt-[26px]">{children}</div>

          <div className="mt-[22px] text-center text-[13.5px] text-ink-subtle">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
