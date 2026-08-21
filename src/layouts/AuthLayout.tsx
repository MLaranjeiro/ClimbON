import { Mountain } from 'lucide-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getHomeRoute } from '../lib/getHomeRoute';

export function AuthLayout() {
  const { session, gymMemberships, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (session) return <Navigate to={getHomeRoute(gymMemberships)} replace />;

  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="relative md:w-1/2 min-h-[280px] bg-gradient-to-br from-brand-500 to-brand-800 flex flex-col items-center justify-center px-8 py-16 overflow-hidden">
        <Mountain className="absolute -bottom-12 -right-12 w-72 h-72 text-white/10" strokeWidth={1} />
        <Mountain className="w-24 h-24 sm:w-28 sm:h-28 text-white/90 mb-8" strokeWidth={1.2} />

        {isLogin || isRegister ? (
          <div className="relative flex items-center gap-1 rounded-full bg-white/15 p-1">
            <Link
              to="/login"
              className={`rounded-full font-semibold text-sm px-6 py-2 transition-colors ${
                isLogin ? 'bg-white text-brand-700' : 'text-white hover:bg-white/10'
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`rounded-full font-semibold text-sm px-6 py-2 transition-colors ${
                isRegister ? 'bg-white text-brand-700' : 'text-white hover:bg-white/10'
              }`}
            >
              Sign Up
            </Link>
          </div>
        ) : (
          <Link to="/login" className="relative rounded-full bg-white text-brand-700 font-semibold text-sm px-6 py-2">
            Back to Login
          </Link>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 mb-10">
            <Mountain className="w-7 h-7 text-brand-600" />
            ClimbON
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
