import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface SlideData {
  id: string;
  title: string;
  subtitle?: string;
  type: 'greeting' | 'notice' | 'alert';
}

interface CarouselBannerProps {
  slides: SlideData[];
}

export default function CarouselBanner({ slides }: CarouselBannerProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 5 second visual rotation
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#3b82f6] via-[#14b8a6] to-[#10b981] p-6 shadow-sm shadow-[#14b8a6]/20 transition-all duration-500 min-h-[140px] flex items-center">
      
      {/* Abstract background elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />

      {/* Content wrapper with fade transition */}
      <div className="relative z-10 flex w-full items-center justify-between animate-[fadeUp_0.5s_ease-out]">
        <div key={currentSlide.id} className="flex-1 animate-[fadeUp_0.3s_ease-out]">
          <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight leading-tight">
            {currentSlide.title}
          </h2>
          {currentSlide.subtitle && (
            <p className="text-white/80 text-sm md:text-base mt-1.5 font-medium">
              {currentSlide.subtitle}
            </p>
          )}
        </div>

        {/* User avatars (Edchemy style has them on the right) */}
        {currentSlide.type === 'greeting' && (
          <div className="shrink-0 flex -space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.[0] ?? 'R'}
            </div>
            {/* Mock second avatar to mimic Edchemy */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/50 bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 font-bold shadow-lg">
              +
            </div>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
