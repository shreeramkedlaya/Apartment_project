import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Suspense, lazy, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import PlaceholderPage from '@/components/common/PlaceholderPage';
import { NAVIGATION } from '@/config/navigation';

// Import Layout Components
import Sidebar, { useDashboardNavigation } from './components/Sidebar';
import Header from './components/Header';

// Lazy load page components
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const RolesPage = lazy(() => import('@/pages/Dashboard/tabs/Administration/RolesPage'));
const UserManagementPage = lazy(() => import('@/pages/Dashboard/tabs/Administration/UserManagement/UserManagementPage'));
const RequestsPage = lazy(() => import('@/pages/Dashboard/tabs/Helpdesk/RequestsPage'));
const CategoriesPage = lazy(() => import('@/pages/Dashboard/tabs/Helpdesk/CategoriesPage'));

// Resident
const ProfilePage = lazy(() => import('@/pages/Dashboard/tabs/ResidentServices/ProfilePage'));
const VehiclesPage = lazy(() => import('@/pages/Dashboard/tabs/ResidentServices/VehiclesPage'));
const ReceiptsPage = lazy(() => import('@/pages/Dashboard/tabs/ResidentServices/ReceiptsPage'));

// Community
const NoticesPage = lazy(() => import('@/pages/Dashboard/tabs/NoticeBoard/NoticeBoardPage'));
const AmenitiesPage = lazy(() => import('@/pages/Dashboard/tabs/Community/AmenitiesPage'));

// Emergency
const EmergencyPage = lazy(() => import('@/pages/Dashboard/tabs/Emergency/EmergencyPage'));

const QuickLoader = () => (
  <div className="flex items-center justify-center py-12 h-full">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

export default function DashboardLayout() {
  const { activeTab, setActiveTab, activeSubTab, setActiveSubTab, isSidebarOpen, setIsSidebarOpen } = useDashboardNavigation();

  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userPerms = user?.permissionTabs?.map(String) || [];

  // Render the correct component based on activeTab and activeSubTab
  const renderContent = useCallback(() => {
    // Route Protection
    if (userPerms.length > 0) {
      const matchedTab = NAVIGATION.find(t => t.id === activeTab);
      if (!matchedTab) return <PlaceholderPage title="Not Found" />;

      if (matchedTab.subTabs) {
        const matchedSub = matchedTab.subTabs.find(s => s.id === activeSubTab);
        if (!matchedSub || !userPerms.includes(String(matchedSub.permissionId))) {
          return <Dashboard />; // Unauthorized, fallback to dashboard
        }
      } else {
        if (!userPerms.includes(String(matchedTab.permissionId))) {
          return <Dashboard />;
        }
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'administration':
        if (activeSubTab === 'users') return <UserManagementPage />;
        if (activeSubTab === 'roles') return <RolesPage />;
        return <PlaceholderPage title="Administration" />;
      case 'resident':
        if (activeSubTab === 'profile') return <ProfilePage />;
        if (activeSubTab === 'vehicles') return <VehiclesPage />;
        if (activeSubTab === 'receipts') return <ReceiptsPage />;
        return <PlaceholderPage title={`Resident Services: ${activeSubTab}`} />;
      case 'helpdesk':
        if (activeSubTab === 'requests') return <RequestsPage />;
        if (activeSubTab === 'categories') return <CategoriesPage />;
        return <PlaceholderPage title={`Helpdesk: ${activeSubTab}`} />;
      case 'community':
        if (activeSubTab === 'notices') return <NoticesPage />;
        if (activeSubTab === 'amenities') return <AmenitiesPage />;
        return <PlaceholderPage title={`Community: ${activeSubTab}`} />;
      case 'emergency':
        return <EmergencyPage />;
      default:
        return <PlaceholderPage title={activeTab} />;
    }
  }, [activeTab, activeSubTab]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Determine dynamic page title for Header
  const getPageTitle = () => {
    if (activeTab === 'dashboard') return 'Dashboard';
    if (activeTab === 'administration' && activeSubTab === 'roles') return 'Role Management';
    if (activeTab === 'administration' && activeSubTab === 'users') return 'User Management';

    // Capitalize first letter
    if (activeSubTab) return activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1);
    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  return (
    <div className="h-screen bg-[#F8F9FB] dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-200 flex overflow-hidden transition-colors">

      {/* Left Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        handleLogout={handleLogout}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Right Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          pageTitle={getPageTitle()}
          isDarkMode={theme === 'dark'}
          toggleDarkMode={toggleTheme}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            <Suspense fallback={<QuickLoader />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

    </div>
  );
}

