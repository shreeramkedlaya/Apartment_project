import { useAuth } from '@/context/AuthContext';
import { Users, Car, PhoneCall } from 'lucide-react';
import ProfileExtensionSection from '../Settings/components/ProfileExtensionSection';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-2xl uppercase border-2 border-blue-200 dark:border-blue-800/60 shrink-0 shadow-inner">
            {(user?.name || 'U').substring(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {user?.name || 'User'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {user?.email || user?.phone || 'No contact info'}
            </p>
            <div className="flex gap-2 mt-2">
              {user?.role && (
                <span className="inline-flex px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {user.role}
                </span>
              )}
              {user?.flatNumber && (
                <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Flat {user.flatNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Extensions (DRY Component) */}
        <ProfileExtensionSection
          title="Family & Co-Residents"
          icon={Users}
          endpoint="/accounts/me/co-residents/"
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Relation', accessor: 'relation' },
            { header: 'Age', accessor: 'age' },
            { header: 'Phone', accessor: 'phone_number' },
          ]}
          fields={[
            { name: 'name', label: 'Full Name', type: 'text' },
            { name: 'relation', label: 'Relationship', type: 'select', options: [
              { label: 'Spouse', value: 'Spouse' },
              { label: 'Child', value: 'Child' },
              { label: 'Parent', value: 'Parent' },
              { label: 'Sibling', value: 'Sibling' },
              { label: 'Relative', value: 'Relative' },
              { label: 'Roommate', value: 'Roommate' },
              { label: 'Other', value: 'Other' }
            ]},
            { name: 'age', label: 'Age', type: 'number' },
            { name: 'phone_number', label: 'Phone Number', type: 'tel', maxLength: 10 },
          ]}
        />

        <ProfileExtensionSection
          title="Vehicles"
          icon={Car}
          endpoint="/accounts/me/vehicles/"
          columns={[
            { header: 'Type', accessor: 'vehicle_type' },
            { header: 'Make/Brand', accessor: 'make' },
            { header: 'Model', accessor: 'model' },
            { header: 'License Plate', accessor: 'license_plate' },
          ]}
          fields={[
            { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: [
              { label: 'Car', value: 'Car' },
              { label: 'Motorcycle', value: 'Motorcycle' },
              { label: 'Bicycle', value: 'Bicycle' },
              { label: 'Other', value: 'Other' }
            ]},
            { name: 'make', label: 'Make / Brand', type: 'text' },
            { name: 'model', label: 'Model', type: 'text' },
            { name: 'license_plate', label: 'License Plate (e.g. MH 12 AB 1234)', type: 'text', uppercase: true, maxLength: 15 },
          ]}
        />

        <ProfileExtensionSection
          title="Emergency Contacts"
          icon={PhoneCall}
          endpoint="/accounts/me/emergency-contacts/"
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Relation', accessor: 'relation' },
            { header: 'Phone', accessor: 'phone_number' },
            { header: 'Primary', accessor: 'is_primary', type: 'badge', badgeConfig: {
                'true': { label: 'Primary', className: 'bg-green-100 text-green-700' },
                'false': { label: 'Secondary', className: 'bg-gray-100 text-gray-700' }
            }}
          ]}
          fields={[
            { name: 'name', label: 'Contact Name', type: 'text' },
            { name: 'relation', label: 'Relationship', type: 'text' },
            { name: 'phone_number', label: 'Phone Number', type: 'tel', maxLength: 10 },
            { name: 'is_primary', label: 'Set as Primary Contact?', type: 'checkbox' },
          ]}
        />
      </div>
    </div>
  );
}
