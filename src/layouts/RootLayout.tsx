import { Bell, Building2, Map, ShieldCog, User } from 'lucide-react';
import { type ComponentType } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import icon from '../assets/climbon-icon.png';
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-10 bg-surface-900 border-b border-surface-700">
        <div className="flex items-center gap-6 max-w-[1400px] mx-auto px-4 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={icon} alt="" className="h-9 w-auto" />
            <span className="text-lg font-semibold text-white">ClimbON</span>
          </Link>

          <nav className="flex items-center gap-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
              className="p-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Bell className="w-5 h-5" />
            </button>
            <AppUserMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-gray-100 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
