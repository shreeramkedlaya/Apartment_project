import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';

import ProtectedRoute from '@/components/common/ProtectedRoute';

// Unified Dashboard
import DashboardLayout from './pages/Dashboard/layouts/DashboardLayout';

// Auth
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

// Home
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* ── Unified Dashboard (all roles) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={
                <NotificationProvider>
                  <DashboardLayout />
                </NotificationProvider>
              } />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
