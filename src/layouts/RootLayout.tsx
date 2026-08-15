import { Mountain } from 'lucide-react';
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
        <AppUserMenu />
      </header>
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
