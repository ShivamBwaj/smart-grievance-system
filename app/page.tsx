import { Suspense } from "react";
import dynamic from "next/dynamic";
import { RevealHero } from "@/components/landing/reveal-hero";
import { Footer } from "@/components/landing/footer";

const StatsBar = dynamic(() =>
  import("@/components/landing/stats-bar").then((m) => ({ default: m.StatsBar })),
);
const ChannelsSection = dynamic(() =>
  import("@/components/landing/animated-sections").then((m) => ({ default: m.ChannelsSection })),
);
const DashboardPreview = dynamic(() =>
  import("@/components/landing/dashboard-preview").then((m) => ({ default: m.DashboardPreview })),
);
const HowItWorksSection = dynamic(() =>
  import("@/components/landing/animated-sections").then((m) => ({ default: m.HowItWorksSection })),
);
const ComparisonSection = dynamic(() =>
  import("@/components/landing/comparison-section").then((m) => ({ default: m.ComparisonSection })),
);
const ProblemSection = dynamic(() =>
  import("@/components/landing/animated-sections").then((m) => ({ default: m.ProblemSection })),
);
const CtaSection = dynamic(() =>
  import("@/components/landing/animated-sections").then((m) => ({ default: m.CtaSection })),
);

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <RevealHero />

        <section className="border-y border-border py-5">
          <div className="max-w-[1200px] mx-auto px-6">
            <p className="text-xs text-muted text-center tracking-widest uppercase">
              Built for municipal desks drowning in Tamil, Hindi, and WhatsApp photos
            </p>
          </div>
        </section>

        <Suspense>
          <StatsBar />
        </Suspense>
        <Suspense>
          <ChannelsSection />
        </Suspense>
        <Suspense>
          <DashboardPreview />
        </Suspense>
        <Suspense>
          <HowItWorksSection />
        </Suspense>
        <Suspense>
          <ComparisonSection />
        </Suspense>
        <Suspense>
          <ProblemSection />
        </Suspense>
        <Suspense>
          <CtaSection />
        </Suspense>

        <section className="pt-8 pb-20 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <span
              className="text-[clamp(60px,13vw,170px)] font-semibold leading-none text-white/[0.03] select-none"
              style={{ fontFamily: "var(--font-display)" }}
              aria-hidden="true"
            >
              CivicLens
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
