import React, { useState, useMemo, useEffect } from 'react';
import { LogOut, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NAVIGATION } from '@/config/navigation';
import type { TabConfig } from '@/config/navigation';

interface SidebarProps {
  isSidebarOpen: boolean;
  activeTab: string;
  setActiveTab: (val: string) => void;
  activeSubTab: string;
  setActiveSubTab: (val: string) => void;
  handleLogout: () => void;
  toggleSidebar: () => void;
}

export function useDashboardNavigation() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('activeSubTab') || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('activeSubTab', activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    localStorage.setItem('isSidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Responsive auto-collapse
  useEffect(() => {
    let lastIsSmall = window.innerWidth <= 768;

    // Initial check
    if (lastIsSmall && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else if (!lastIsSmall && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }

    const handleResize = () => {
      const isSmall = window.innerWidth <= 768;
      if (isSmall !== lastIsSmall) {
        setIsSidebarOpen(!isSmall);
        lastIsSmall = isSmall;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run once on mount

  return {
    activeTab, setActiveTab,
    activeSubTab, setActiveSubTab,
    isSidebarOpen, setIsSidebarOpen
  };
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  handleLogout,
  toggleSidebar,
}) => {
  const { user, hasPermission } = useAuth();
  const [openTabs, setOpenTabs] = useState<Set<string>>(() => new Set([activeTab]));
  // Filter tabs based on permission
  const filteredTabs = useMemo(() => {
    // If super admin / All permissions, return all navigation tabs directly
    if (user?.permissionTabs === "All") {
      return NAVIGATION;
    }

    // If no permissions array, they should only see the Dashboard
    const dashboardTab = NAVIGATION.find(t => t.id === 'dashboard');
    if (!user?.permissionTabs || user.permissionTabs.length === 0) {
      return dashboardTab ? [dashboardTab] : [];
    }

    return NAVIGATION.map(tab => {
      if (tab.id === 'dashboard') return tab; // Dashboard always visible

      if (!tab.subTabs) {
        return hasPermission(tab.permissionId) ? tab : null;
      }
      const allowedSubs = tab.subTabs.filter(s => hasPermission(s.permissionId));
      if (allowedSubs.length === 0) return null;
      return { ...tab, subTabs: allowedSubs };
    }).filter(Boolean) as TabConfig[];
  }, [user, hasPermission]);

  const handleTabClick = (tab: TabConfig) => {
    const hasSubTabs = (tab.subTabs?.length ?? 0) > 0;

    // If collapsed, clicking a tab should probably open the sidebar, but we don't have setIsSidebarOpen here.
    // DashboardLayout handles the state. Assuming it stays collapsed unless toggled via header.

    if (hasSubTabs) {
      setOpenTabs((prev) => {
        const next = new Set(prev);
        if (next.has(tab.id)) {
          next.delete(tab.id);
        } else {
          next.add(tab.id);
        }
        return next;
      });
    } else {
      setActiveTab(tab.id);
      setActiveSubTab('');
      setOpenTabs(new Set([tab.id]));
    }
  };

  const handleSubTabClick = (tabId: string, subTabId: string) => {
    setActiveTab(tabId);
    setActiveSubTab(subTabId);
  };

  return (
    <aside
      className={`bg-white dark:bg-[#1c1d21] border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-[4px_0_24px_rgb(0,0,0,0.02)] ${isSidebarOpen ? 'w-64' : 'w-20'
        }`}
    >
      {/* Sidebar Header (Logo) */}
      <div className="h-16 flex items-center border-b border-gray-100 dark:border-gray-800 px-4 shrink-0 overflow-hidden group">
        {isSidebarOpen ? (
          <div className="flex items-center justify-between w-full pl-2">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Jains</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">Prakriti</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Close Sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative cursor-pointer" onClick={toggleSidebar}>
            {/* JP text shown by default, hidden on group hover */}
            <div className="flex items-center justify-center font-bold text-xl tracking-tight absolute inset-0 transition-opacity duration-200 group-hover:opacity-0">
              <span className="text-gray-900 dark:text-white">J</span>
              <span className="text-blue-600 dark:text-blue-400">P</span>
            </div>
            {/* Panel right icon hidden by default, shown on group hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                className="p-1.5 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-[#1c1d21]"
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <div className="px-3 space-y-1">
          {filteredTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isOpen = openTabs.has(tab.id);
            const hasSubTabs = (tab.subTabs?.length ?? 0) > 0;

            return (
              <div key={tab.id} className="flex flex-col">
                <button
                  onClick={() => handleTabClick(tab)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-medium ${isActive && !hasSubTabs
                    ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 shadow-sm'
                    : isActive && hasSubTabs
                      ? 'text-blue-600 dark:text-blue-400 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  title={!isSidebarOpen ? tab.label : ""}
                >
                  <div className="flex items-center gap-3 w-full">
                    <tab.icon className={`w-5 h-5 shrink-0 ${isSidebarOpen ? '' : 'mx-auto'}`} />
                    {isSidebarOpen && (
                      <span className="whitespace-nowrap text-sm flex-1 text-left">{tab.label}</span>
                    )}
                  </div>
                  {isSidebarOpen && hasSubTabs && (
                    <div className="shrink-0 ml-2 text-gray-400">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  )}
                </button>

                {/* Sub-tabs Accordion */}
                {isSidebarOpen && hasSubTabs && isOpen && (
                  <div className="mt-1 flex flex-col space-y-0.5 ml-9 border-l border-gray-100 dark:border-gray-800/50 pl-3">
                    {tab.subTabs?.map((sub) => {
                      const isSubActive = isActive && activeSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSubTabClick(tab.id, sub.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSubActive
                            ? 'bg-blue-50/50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile Card - Display Only */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 relative">
        {isSidebarOpen ? (
          <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm uppercase border border-blue-200 dark:border-blue-800/60 shrink-0">
                {(user?.name || 'U').substring(0, 1).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </span>
                {user?.phone && (
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-mono truncate">
                    {user.phone}
                  </span>
                )}
                <span className="text-[11px] text-gray-400 dark:text-gray-400 truncate capitalize font-medium">
                  {user?.role || 'Resident'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs uppercase border border-blue-200 dark:border-blue-800/60"
              title={`${user?.name || 'User'} • ${user?.role || 'Resident'}${user?.phone ? ` • ${user.phone}` : ''}`}
            >
              {(user?.name || 'U').substring(0, 1).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
