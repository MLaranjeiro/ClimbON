import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Gym } from '../types';

export function useGymBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['gym-by-slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('slug', slug!).single();
      if (error) throw error;
      return data as Gym;
    },
  });
}
