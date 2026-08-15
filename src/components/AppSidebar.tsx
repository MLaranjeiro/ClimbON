import { Home, Map, PanelLeftClose, PanelLeftOpen, ShieldCog } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/auth';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const baseNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/routes', label: 'Routes', icon: Map },
];

export function AppSidebar() {
  const { profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const items = [...baseNavItems];
  if (profile?.role === 'route_setter') {
    items.push({ to: '/admin', label: 'Admin', icon: ShieldCog });
  }

  return (
    <aside
      className={`flex flex-col justify-between border-r border-surface-700 bg-surface-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <nav className="flex flex-col gap-1 p-2 mt-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-surface-700 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-3 m-2 rounded-lg px-3 py-3 text-sm text-gray-400 hover:bg-surface-700 hover:text-white"
      >
        {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
