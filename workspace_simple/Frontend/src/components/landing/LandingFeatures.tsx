import { Receipt, Wrench, Bell } from 'lucide-react';

export default function LandingFeatures() {
  return (
    <section className="px-6 py-20 bg-surface border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 fade-up">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text mb-4">Everything you need</h2>
          <p className="text-text-muted max-w-xl mx-auto">Powerful tools designed specifically for modern apartment communities to make everyday life simpler.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Feature 1 */}
          <div className="glass p-8 rounded-3xl fade-up" style={{ animationDelay: '100ms' }}>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-text mb-3">Smart Billing</h3>
            <p className="text-text-muted leading-relaxed">
              Automated dues tracking, instant invoicing, and a complete history of all your online payments in one secure dashboard.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass p-8 rounded-3xl fade-up" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
              <Wrench className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-text mb-3">Instant Maintenance</h3>
            <p className="text-text-muted leading-relaxed">
              Raise maintenance requests in seconds. Track their status in real-time, get assigned staff details, and rate the resolution.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass p-8 rounded-3xl fade-up" style={{ animationDelay: '300ms' }}>
            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center mb-6">
              <Bell className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-bold text-text mb-3">Community Notices</h3>
            <p className="text-text-muted leading-relaxed">
              Never miss an important update. Receive instant broadcast notices, circulars, and event invitations directly from the association.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
