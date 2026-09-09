import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="w-full px-6 py-10 bg-bg border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-display font-bold text-lg text-text">
            Jains <span className="text-primary">Prakriti</span>
          </span>
          <span className="text-sm text-text-muted">© 2026 Management Association. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <Link to="#" className="text-sm text-text-muted hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="#" className="text-sm text-text-muted hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="#" className="text-sm text-text-muted hover:text-primary transition-colors">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}
