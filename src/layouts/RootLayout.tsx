import { Bell, Building2, Map, Mountain, ShieldCog, User } from 'lucide-react';
import { type ComponentType } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AppUserMenu } from '../components/AppUserMenu';
import { useAuth } from '../context/auth';
import { hasAnyGymRole } from '../lib/permissions';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const baseNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: User, end: true },
  { to: '/routes', label: 'Routes', icon: Map },
];

export function RootLayout() {
  const { profile, gymMemberships } = useAuth();

  const items = [...baseNavItems];
  if (hasAnyGymRole(gymMemberships)) {
    items.push({ to: '/admin', label: 'Admin', icon: ShieldCog });
  }
  if (profile?.is_platform_admin) {
    items.push({ to: '/platform/gyms', label: 'Manage Gyms', icon: Building2 });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-surface-700 bg-surface-800 px-6 py-2.5">
        <div className="flex items-center gap-6 max-w-[1400px] mx-auto">
          <Link to="/" className="flex items-center gap-2 font-bold text-white shrink-0">
            <Mountain className="w-5 h-5 text-brand-500" />
            ClimbON
          </Link>

          <nav className="flex items-center gap-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-surface-700 text-white' : 'text-gray-300 hover:bg-surface-700 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              title="Notifications (coming soon)"
              className="p-2 rounded-lg text-gray-300 hover:bg-surface-700 hover:text-white"
            >
              <Bell className="w-5 h-5" />
            </button>
            <AppUserMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
