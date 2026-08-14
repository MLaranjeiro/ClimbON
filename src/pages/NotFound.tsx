import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="card text-center max-w-sm mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 mb-4">This route doesn't exist — pun intended.</p>
      <Link to="/" className="btn-primary inline-block">
        Back to dashboard
      </Link>
    </div>
  );
}
