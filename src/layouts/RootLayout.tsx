import { Link, Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-700 bg-surface-800">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-bold text-lg text-white">
            Beta Tracker
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/routes" className="text-gray-300 hover:text-white">
              Routes
            </Link>
            <Link to="/profile" className="text-gray-300 hover:text-white">
              Profile
            </Link>
            <Link to="/admin" className="text-gray-300 hover:text-white">
              Admin
            </Link>
            <Link to="/login" className="btn-primary text-sm">
              Log in
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
