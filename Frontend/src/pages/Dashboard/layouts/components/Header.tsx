import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Bell, Check, Trash2 } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

interface HeaderProps {
  pageTitle: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({
  pageTitle,
  isDarkMode,
  toggleDarkMode,
}) => {
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead, clearAll } = useNotification();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-[#1c1d21] px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 h-16 shadow-sm transition-colors">
      {/* Left: Empty space to balance the header */}
      <div className="flex items-center gap-3 w-1/3"></div>

      {/* Center: Page Title */}
      <div className="flex items-center justify-center w-1/3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{pageTitle}</h1>
      </div>

      {/* Right: Notifications & Theme toggle */}
      <div className="flex items-center justify-end relative w-1/3 gap-3">

        {/* Dark Mode Toggle button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Flyout */}
          {bellOpen && (
            <div className="absolute top-12 right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No notifications yet</p>
                    <p className="text-xs text-gray-500 mt-1">We'll alert you when something happens.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 flex gap-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                        }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-bold text-xs">
                        {notif.notice_id ? '📢' : '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!notif.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 transition-all shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
