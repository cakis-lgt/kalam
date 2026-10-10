import Link from "next/link";

export function TestFooter() {
  return (
    <footer className="flex w-full shrink-0 flex-col gap-3 border-t border-outline-variant bg-surface-container-highest px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-margin-desktop">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <span className="text-label-sm text-on-surface-variant">
          Official ALIKHTIBAR Test — Speaking
        </span>
        <div className="flex gap-4">
          <a
            href="mailto:support@kalam.id"
            className="text-label-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            Contact Support
          </a>
          <Link
            href="/"
            className="text-label-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
      <p className="text-[12px] text-on-surface-variant opacity-60">
        © {new Date().getFullYear()} ALIKHTIBAR Speaking Assessment
      </p>
    </footer>
  );
}
