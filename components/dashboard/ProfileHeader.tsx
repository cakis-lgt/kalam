import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { CandidateProfile } from "@/lib/dashboard/mock-data";
import { cefrSolidClass } from "@/lib/dashboard/cefr-badge";

type Props = {
  profile: CandidateProfile;
};

export function ProfileHeader({ profile }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 rounded-2xl border border-white bg-surface-container-lowest p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] md:col-span-2 md:flex-row">
      <div className="relative shrink-0">
        <Image
          src={profile.avatarUrl}
          alt=""
          width={128}
          height={128}
          className="h-32 w-32 rounded-full border-4 border-primary-fixed object-cover"
        />
        <div
          className={`absolute bottom-1 right-1 rounded-lg border-2 border-surface-container-lowest px-2 py-1 text-[12px] font-bold text-white ${cefrSolidClass(profile.currentLevel)}`}
        >
          {profile.currentLevel}
        </div>
      </div>

      <div className="flex-grow text-center md:text-left">
        <h1 className="mb-1 text-headline-xl text-primary">{profile.fullName}</h1>
        <p className="mb-4 text-body-lg text-on-surface-variant">
          {profile.institution}
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          {profile.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full shrink-0 md:w-auto">
        <Link
          href="/tes"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-label-sm font-medium text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95 md:w-auto"
        >
          <Play className="h-5 w-5 fill-current" aria-hidden />
          Start New Test Session
        </Link>
      </div>
    </div>
  );
}
