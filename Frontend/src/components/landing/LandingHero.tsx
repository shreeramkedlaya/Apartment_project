import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingHero() {
  const { user } = useAuth();

  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center fade-up">
      <div className="glass px-4 py-1.5 rounded-full mb-8 inline-flex items-center gap-2 border-primary/20 shadow-sm">
        <span className="shrink-0 w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-medium text-text-sub">Portal is now live for all residents</span>
      </div>

      <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text max-w-4xl mx-auto leading-[1.15]">
        Elevate Your <br className="hidden md:block" />
        <span className="gradient-text">Community Living</span>
      </h1>

      <p className="mt-6 text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
        Experience seamless apartment management. From instant complaint resolution to transparent billing, Jains Prakriti brings your entire community into one unified platform.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to={user ? '/dashboard' : '/login'}
          className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-text text-bg hover:opacity-90 font-semibold rounded-xl transition-all active:scale-95"
        >
          {user ? 'Go to Dashboard' : 'Access Portal'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <button className="w-full sm:w-auto px-8 py-3.5 bg-surface text-text font-semibold rounded-xl border border-border hover:bg-surface-2 transition-all active:scale-95">
          Learn More
        </button>
      </div>
    </section>
  );
}
