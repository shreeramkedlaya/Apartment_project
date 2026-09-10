import { AlertTriangle } from 'lucide-react';

export default function EmergencyPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Contacts</h2>
        <p className="text-gray-500 max-w-md mx-auto">Quick access to emergency services, security, and facility management contacts.</p>
      </div>
    </div>
  );
}
