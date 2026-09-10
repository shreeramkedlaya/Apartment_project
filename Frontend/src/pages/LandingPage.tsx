import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-text selection:bg-primary/20 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-70 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[100px] opacity-70 animate-[pulse_10s_ease-in-out_infinite_reverse]" />
      </div>

      <LandingNavbar />

      <main className="flex-1 flex flex-col w-full">
        <LandingHero />
        <LandingFeatures />
      </main>

      <LandingFooter />

    </div>
  );
}
