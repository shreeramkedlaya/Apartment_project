import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 max-w-sm w-full text-center flex flex-col items-center shadow-sm">
        <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h1 className="text-3xl font-display font-bold text-text mb-1">404</h1>
        <h2 className="text-lg font-medium text-text mb-3">Page Not Found</h2>

        <p className="text-text-sub text-sm text-center mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors w-full"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
