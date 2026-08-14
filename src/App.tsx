import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { Dashboard } from './pages/Dashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { RouteDetails } from './pages/RouteDetails';
import { RouteList } from './pages/RouteList';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="profile" element={<Profile />} />
            <Route path="routes" element={<RouteList />} />
            <Route path="routes/:routeId" element={<RouteDetails />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
