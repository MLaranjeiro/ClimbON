import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/auth';
import { AuthLayout } from './layouts/AuthLayout';
import { RootLayout } from './layouts/RootLayout';
import { AccountSettings } from './pages/AccountSettings';
import { AdminDashboard } from './pages/AdminDashboard';
import { Dashboard } from './pages/Dashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { GymAbout } from './pages/GymAbout';
import { GymMap } from './pages/GymMap';
import { GymOverview } from './pages/GymOverview';
import { GymPicker } from './pages/GymPicker';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { PlatformGyms } from './pages/PlatformGyms';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { RouteDetail } from './pages/RouteDetail';
import { SectionClimbs } from './pages/SectionClimbs';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>
            <Route
              element={
                <ProtectedRoute>
                  <RootLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="routes" element={<GymPicker />} />
              <Route path="routes/:gymId" element={<GymOverview />} />
              <Route path="routes/:gymId/map" element={<GymMap />} />
              <Route path="routes/:gymId/about" element={<GymAbout />} />
              <Route path="routes/:gymId/sections/:sectionId" element={<SectionClimbs />} />
              <Route path="routes/:gymId/climbs/:routeId" element={<RouteDetail />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireGymRole>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="platform/gyms"
                element={
                  <ProtectedRoute requirePlatformAdmin>
                    <PlatformGyms />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
