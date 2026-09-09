import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Calendar, Car, ChevronLeft, ChevronRight, FileText, MessageSquare, Receipt, User } from 'lucide-react';
import ResidentNoticeFeed from './components/ResidentNoticeFeed';
import { dashboardService } from './services/dashboard.service';
import type { DashboardSummary } from './services/dashboard.service';
import NoticeDetailsPanel from './tabs/NoticeBoard/components/NoticeDetailsPanel';
import type { Notice } from './tabs/NoticeBoard/services/notice.service';
import { useDashboardNavigation } from './layouts/components/Sidebar';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const { setActiveTab, setActiveSubTab } = useDashboardNavigation();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getSummary();
        setSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard summary", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const quickAccessItems = [
    { name: 'My Profile', icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', tab: 'resident', sub: 'profile' },
    { name: 'Receipts', icon: Receipt, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', tab: 'resident', sub: 'receipts' },
    { name: 'Requests', icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', tab: 'helpdesk', sub: 'requests' },
    { name: 'Notices', icon: Bell, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', tab: 'community', sub: 'notices' },
    { name: 'Amenities', icon: Calendar, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', tab: 'community', sub: 'amenities' },
    { name: 'Vehicles', icon: Car, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30', tab: 'resident', sub: 'vehicles' },
    { name: 'SOS Alert', icon: AlertTriangle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', tab: 'emergency', sub: undefined },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (summary && summary.hero_carousel.length > 0) {
      setCurrentSlide((prev) => (prev === 0 ? summary.hero_carousel.length - 1 : prev - 1));
    }
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (summary && summary.hero_carousel.length > 0) {
      setCurrentSlide((prev) => (prev === summary.hero_carousel.length - 1 ? 0 : prev + 1));
    }
  };

  const handleHeroClick = () => {
    if (summary && summary.hero_carousel.length > 0) {
      setSelectedNotice(summary.hero_carousel[currentSlide]);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Hero Banner Carousel */}
      <div 
        onClick={handleHeroClick}
        className="bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 rounded-3xl p-8 text-white shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group min-h-[160px]"
      >
        {summary && summary.hero_carousel.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-2 pr-8">{summary.hero_carousel[currentSlide].title}</h2>
            <p className="text-white/90 pr-8 line-clamp-2">{summary.hero_carousel[currentSlide].content}</p>
            
            {/* Arrows */}
            {summary.hero_carousel.length > 1 && (
              <>
                <button 
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/20 hover:bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/20 hover:bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                
                {/* Pagination Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {summary.hero_carousel.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                    ></div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">Welcome to the Community</h2>
            <p className="text-white/90">Stay tuned for upcoming notices and events.</p>
          </>
        )}
      </div>

      {/* Overview Section */}
      <section>
        <h3 className="text-xs font-bold tracking-wider text-gray-500 mb-4 uppercase">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Fee Due */}
          <div 
            onClick={() => { setActiveTab('resident'); setActiveSubTab('receipts'); }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 border-t-red-500 flex flex-col justify-between hover:shadow-md dark:hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Fee Due</h4>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">₹{summary?.metrics.fee_due || '0'}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Make payment before 5th</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Publications */}
          <div 
            onClick={() => { setActiveTab('community'); setActiveSubTab('notices'); }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 border-t-blue-500 flex flex-col justify-between hover:shadow-md dark:hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Notices</h4>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{summary?.metrics.unread_notices || 0}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Unread notices</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 3: Active Request */}
          <div 
            onClick={() => { setActiveTab('helpdesk'); setActiveSubTab('requests'); }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 border-t-yellow-400 flex flex-col justify-between hover:shadow-md dark:hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Active Requests</h4>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{summary?.metrics.open_issues || 0} Open</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Out of {summary?.metrics.total_issues || 0} total</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Holidays & Events and Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Recent Notices</h3>
          </div>
          <ResidentNoticeFeed />
        </div>

        {/* Right Column: Upcoming Holidays */}
        <div>
          <h3 className="text-xs font-bold tracking-wider text-gray-500 mb-4 uppercase">Upcoming Events & Holidays</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {summary?.upcoming_holidays && summary.upcoming_holidays.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {summary.upcoming_holidays.map((h, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-default">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                        <span className="text-xs font-semibold uppercase">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg font-bold leading-none">{new Date(h.date).getDate()}</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{h.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{h.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events or holidays.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <section>
        <h3 className="text-xs font-bold tracking-wider text-gray-500 mb-4 uppercase">Quick Access</h3>
        <div className="flex flex-wrap gap-4">
          {quickAccessItems.map((item) => (
            <button
              key={item.name}
              onClick={() => { setActiveTab(item.tab); if (item.sub) setActiveSubTab(item.sub); }}
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

      {/* Notice Details Modal */}
      {selectedNotice && (
        <NoticeDetailsPanel 
          notice={selectedNotice} 
          onClose={() => setSelectedNotice(null)} 
          onNoticeUpdated={() => {
            dashboardService.getSummary().then(res => setSummary(res.data));
          }}
          canManageNotices={false}
        />
      )}

    </div>
  );
}
