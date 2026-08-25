import { useQuery } from '@tanstack/react-query';
import { Camera, FileText, Globe, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Gym } from '../types';

export function GymAboutContent({ gymId }: { gymId: number }) {
  const { data: gym, isLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', gymId).single();
      if (error) throw error;
      return data as Gym;
    },
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  const directionsUrl = gym.location_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.location_address)}`
    : null;

  return (
    <div className="space-y-6">
      {gym.location_address && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</h2>
          <div className="card-light flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-gray-900">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {gym.location_address}
            </span>
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 text-sm font-medium hover:underline shrink-0"
              >
                Directions
              </a>
            )}
          </div>
        </section>
      )}

      {(gym.website || gym.phone) && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</h2>
          <div className="space-y-2">
            {gym.website && (
              <a
                href={gym.website}
                target="_blank"
                rel="noreferrer"
                className="card-light flex items-center gap-2 text-gray-900 hover:text-brand-600"
              >
                <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                {gym.website}
              </a>
            )}
            {gym.phone && (
              <a href={`tel:${gym.phone}`} className="card-light flex items-center gap-2 text-gray-900 hover:text-brand-600">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                {gym.phone}
              </a>
            )}
          </div>
        </section>
      )}

      {gym.amenities.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {gym.amenities.map((amenity) => (
              <span key={amenity} className="badge bg-gray-100 text-gray-700">
                {amenity}
              </span>
            ))}
          </div>
        </section>
      )}

      {gym.instagram_url && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Social</h2>
          <a
            href={gym.instagram_url}
            target="_blank"
            rel="noreferrer"
            className="card-light flex items-center gap-2 text-gray-900 hover:text-brand-600"
          >
            <Camera className="w-4 h-4 text-gray-400 shrink-0" />
            {gym.instagram_url}
          </a>
        </section>
      )}

      {gym.waiver_text && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Waiver</h2>
          <a
            href={gym.waiver_text}
            target="_blank"
            rel="noreferrer"
            className="card-light flex items-center gap-2 text-gray-900 hover:text-brand-600"
          >
            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
            Review and sign waiver
          </a>
        </section>
      )}
    </div>
  );
}
