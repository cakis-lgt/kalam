import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  showTitle?: boolean;
  imageOnly?: boolean;
  variant?: "light" | "dark";
  className?: string;
};

const SIZES = {
  sm: { image: 28, title: "text-base", sub: "text-[9px]" },
  md: { image: 32, title: "text-lg", sub: "text-[10px]" },
  lg: { image: 40, title: "text-xl", sub: "text-[10.5px]" },
};

export function KalamLogo({
  href = "/",
  size = "md",
  showSubtitle = true,
  showTitle = true,
  imageOnly = false,
  variant = "light",
  className = "",
}: Props) {
  const s = SIZES[size];
  const titleColor = variant === "dark" ? "text-slate-100" : "text-ink";
  const subColor = variant === "dark" ? "text-slate-500" : "text-ink-faint";

  const logoImage = (
    <Image
      src="/logo-dpb.png"
      alt="ALIKHTIBAR"
      width={s.image}
      height={s.image}
      className="shrink-0 rounded-full object-contain"
      priority
    />
  );

  const content = imageOnly ? (
    logoImage
  ) : (
    <div className={`flex items-center gap-[11px] ${className}`}>
      {logoImage}
      {(showTitle || showSubtitle) && (
        <div className="flex flex-col leading-[1.05]">
          {showTitle && (
            <span
              className={`font-heading font-semibold tracking-[-0.01em] ${s.title} ${titleColor}`}
            >
              ALIKHTIBAR
            </span>
          )}
          {showSubtitle && (
            <span className={`font-medium tracking-[0.03em] ${s.sub} ${subColor}`}>
              SPEAKING
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
