import { AlertTriangle, Bell, Calendar, Car, ChevronRight, FileText, MessageSquare, Receipt, Settings, User } from 'lucide-react';
import ResidentNoticeFeed from './components/ResidentNoticeFeed';

export default function Dashboard() {

  const quickAccessItems = [
    { name: 'My Profile', icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { name: 'Receipts', icon: Receipt, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { name: 'Requests', icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { name: 'Notices', icon: Bell, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { name: 'Amenities', icon: Calendar, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
    { name: 'Vehicles', icon: Car, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
    { name: 'SOS Alert', icon: AlertTriangle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
    { name: 'Settings', icon: Settings, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
  ];

  return (
    <div className="space-y-10">

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <h2 className="text-2xl font-bold mb-2">Scheduled Maintenance</h2>
        <p className="text-white/90">Water supply interruption tomorrow from 10 AM to 2 PM.</p>

        {/* Pagination Dots (Decorative for mockup) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className="w-4 h-1.5 rounded-full bg-white"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
        </div>
      </div>

      {/* Recent Notices Feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Recent Notices</h3>
        </div>
        <div className="max-w-2xl">
          <ResidentNoticeFeed />
        </div>
      </section>

      {/* Quick Access Section */}
      <section>
        <h3 className="text-xs font-bold tracking-wider text-gray-500 mb-4 uppercase">Quick Access</h3>
        <div className="flex flex-wrap gap-4">
          {quickAccessItems.map((item) => (
            <button
              key={item.name}
              className="w-24 h-28 flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md dark:hover:border-gray-600 transition-all group shrink-0"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Overview Section */}
      <section>
        <h3 className="text-xs font-bold tracking-wider text-gray-500 mb-4 uppercase">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Fee Due */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 border-t-red-500 flex flex-col justify-between hover:shadow-md dark:hover:border-gray-600 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Fee Due</h4>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">₹4,500</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Make payment before 5th</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Publications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 border-t-blue-500 flex flex-col justify-between hover:shadow-md dark:hover:border-gray-600 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Publications</h4>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">3</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Unread notices</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 3: Active Request */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 border-t-yellow-400 flex flex-col justify-between hover:shadow-md dark:hover:border-gray-600 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Active Request</h4>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Plumbing</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Assigned to Ramesh</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
