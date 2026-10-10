import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FlowStepsSection } from "@/components/landing/FlowStepsSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page">
      <LandingNav />
      <main>
        <LandingHero />
        <FeaturesSection />
        <FlowStepsSection />
      </main>
      <LandingFooter />
    </div>
  );
}
