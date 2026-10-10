function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-container-high ${className}`}
      aria-hidden
    />
  );
}

type Variant = "dashboard" | "table" | "practice" | "profile" | "portal";

export function PortalPageSkeleton({ variant = "portal" }: { variant?: Variant }) {
  return (
    <main className="mx-auto max-w-[980px] px-margin-mobile pb-16 pt-10 md:px-gutter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        {variant === "dashboard" && <Skeleton className="h-12 w-36 shrink-0" />}
      </div>

      {variant === "dashboard" && (
        <>
          <div className="mb-[30px] grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Skeleton className="h-36 rounded-[14px]" />
            <Skeleton className="h-36 rounded-[14px]" />
          </div>
          <div className="mb-[30px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Skeleton className="h-[88px] rounded-[14px]" />
            <Skeleton className="h-[88px] rounded-[14px]" />
            <Skeleton className="h-[88px] rounded-[14px]" />
          </div>
        </>
      )}

      {variant === "table" && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-20 rounded-[14px]" />
          <Skeleton className="h-20 rounded-[14px]" />
          <Skeleton className="h-20 rounded-[14px]" />
          <Skeleton className="h-20 rounded-[14px]" />
        </div>
      )}

      {variant === "practice" && (
        <Skeleton className="mb-6 h-40 rounded-[16px]" />
      )}

      {variant === "profile" && (
        <Skeleton className="mb-6 h-[420px] rounded-[14px]" />
      )}

      <div className="space-y-3">
        <Skeleton className="h-[88px] rounded-[14px]" />
        <Skeleton className="h-[88px] rounded-[14px]" />
        <Skeleton className="h-[88px] rounded-[14px]" />
      </div>
    </main>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-64 rounded-[14px]" />
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-[14px]" />
        <Skeleton className="h-14 rounded-[14px]" />
        <Skeleton className="h-14 rounded-[14px]" />
      </div>
    </div>
  );
}
