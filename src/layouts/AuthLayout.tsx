import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import authHero from '../assets/auth-hero.webp';
import icon from '../assets/climbon-icon.png';
import { useAuth } from '../context/auth';
import { getHomeRoute } from '../lib/getHomeRoute';

export function AuthLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (session) return <Navigate to={getHomeRoute()} replace />;

  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="relative md:w-1/2 min-h-[360px] overflow-hidden">
        <img src={authHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end h-full min-h-[360px] px-8 py-10 sm:px-10 sm:py-12">
          <div className="max-w-sm">
            <p className="text-xl sm:text-2xl font-semibold text-white leading-snug mb-4">
              Log your sends. Share your beta. Track your progression.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 text-sm text-white/90">
              Built for climbers, by climbers
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 mb-8">
            <img src={icon} alt="" className="w-7 h-7" />
            ClimbON
          </div>

          <div className="flex justify-center mb-8">
            {isLogin || isRegister ? (
              <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                <Link
                  to="/login"
                  className={`rounded-full font-semibold text-sm px-6 py-2 transition-colors ${
                    isLogin ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`rounded-full font-semibold text-sm px-6 py-2 transition-colors ${
                    isRegister ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline">
                ← Back to Login
              </Link>
            )}
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
