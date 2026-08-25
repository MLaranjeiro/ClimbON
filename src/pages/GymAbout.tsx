import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { GymAboutContent } from '../components/GymAboutContent';
import { supabase } from '../lib/supabase';
import type { Gym } from '../types';

export function GymAbout() {
  const { gymId } = useParams();
  const id = Number(gymId);

  const { data: gym } = useQuery({
    queryKey: ['gym', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Gym;
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">About {gym?.gym_name ?? 'gym'}</h1>
      </div>
      <GymAboutContent gymId={id} />
    </div>
  );
}
