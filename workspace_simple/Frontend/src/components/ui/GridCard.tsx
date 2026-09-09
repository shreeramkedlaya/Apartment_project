import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface GridCardProps {
  label: string;
  icon: ReactNode;
  iconBgColor?: string;
  to: string;
  delay?: string;
}

export default function GridCard({ label, icon, iconBgColor = 'bg-primary/10 text-primary', to, delay = '0ms' }: GridCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center justify-center p-4 bg-surface rounded-3xl border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 w-full aspect-square fade-up"
      style={{ animationDelay: delay }}
    >
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${iconBgColor}`}>
        {icon}
      </div>
      <span className="text-[11px] md:text-xs font-semibold text-text-sub text-center leading-tight px-1">
        {label}
      </span>
    </button>
  );
}
