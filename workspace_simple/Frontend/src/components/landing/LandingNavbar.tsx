import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Sun, Moon } from 'lucide-react';

export default function LandingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-bg/70 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-display font-bold text-xl tracking-tight text-text">
            Jains <span className="text-primary">Prakriti</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-sub hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" strokeWidth={1.8} /> : <Moon className="w-5 h-5" strokeWidth={1.8} />}
          </button>
          
          <Link 
            to={user ? '/dashboard' : '/login'}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all active:scale-95 shadow-sm shadow-primary/20"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>
        </div>
      </div>
    </header>
  );
}
