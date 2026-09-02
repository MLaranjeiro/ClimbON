import { Map, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/auth';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
  }`;

export function HomeGymNav() {
  const { homeGym } = useAuth();

  return (
    <>
      <NavLink to="/gyms" end className={navLinkClasses}>
        <Map className="w-4 h-4 shrink-0" />
        <span>Gyms</span>
      </NavLink>

      {homeGym && (
        <NavLink to={`/gyms/${homeGym.slug}`} className={navLinkClasses} title={homeGym.gym_name}>
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="max-w-[12rem] truncate">{homeGym.gym_name}</span>
        </NavLink>
      )}
    </>
  );
}
