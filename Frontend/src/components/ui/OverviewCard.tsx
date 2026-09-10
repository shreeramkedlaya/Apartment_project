import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface OverviewCardProps {
  title: string;
  value: ReactNode;
  subtext?: string;
  icon: ReactNode;
  iconBgColor?: string;
  borderColor?: string;
  to: string;
  delay?: string;
}

export default function OverviewCard({ 
  title, 
  value, 
  subtext, 
  icon, 
  iconBgColor = 'text-primary bg-primary/10',
  borderColor = 'border-primary/30',
  to,
  delay = '0ms'
}: OverviewCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      className={`bg-surface rounded-3xl p-5 border-t-4 border-x border-b border-x-border border-b-border ${borderColor} shadow-sm hover:shadow-md transition-shadow fade-up relative flex flex-col justify-between min-h-[140px]`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColor}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-text-sub text-sm">{title}</h3>
        </div>
      </div>
      
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="font-display font-bold text-2xl text-text">{value}</div>
          {subtext && <div className="text-xs text-text-muted mt-1 font-medium">{subtext}</div>}
        </div>
        
        <button 
          onClick={() => navigate(to)}
          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-muted hover:bg-primary hover:text-white transition-colors active:scale-95"
          aria-label={`Go to ${title}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
