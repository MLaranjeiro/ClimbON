import { Bell, Mountain } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { AppUserMenu } from '../components/AppUserMenu';

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-900">
      <header className="flex items-center justify-between border-b border-surface-700 bg-surface-800 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 font-bold text-white">
          <Mountain className="w-5 h-5 text-brand-500" />
          Beta Tracker
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Notifications (coming soon)"
            className="p-2 rounded-lg text-gray-300 hover:bg-surface-700 hover:text-white"
          >
            <Bell className="w-5 h-5" />
          </button>
          <AppUserMenu />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
