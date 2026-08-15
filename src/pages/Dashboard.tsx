import { useQuery } from '@tanstack/react-query';
import { Award, Calendar, CheckCircle, Flame, MessageSquare, Mountain, Sparkles, Target } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/auth';
import { GRADE_ORDER, getHighestGrade } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { RouteGrade } from '../types';

interface SendRow {
  id: number;
  date_completed: string;
  route: {
    id: number;
    route_name: string;
    grade: RouteGrade;
    gym: { gym_name: string } | null;
  } | null;
}

interface BetaRow {
  id: number;
  description_text: string | null;
  video_url: string | null;
  created_at: string;
  route: { id: number; route_name: string } | null;
}

function isThisMonth(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function Dashboard() {
  const { user, profile } = useAuth();

  const { data: sends, isLoading: sendsLoading } = useQuery({
    queryKey: ['sends', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sends')
        .select('id, date_completed, route:routes(id, route_name, grade, gym:gyms(gym_name))')
        .eq('user_id', user!.id)
        .order('date_completed', { ascending: false });
      if (error) throw error;
      return data as unknown as SendRow[];
    },
  });

  const { data: betas, isLoading: betasLoading } = useQuery({
    queryKey: ['beta', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta')
        .select('id, description_text, video_url, created_at, route:routes(id, route_name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BetaRow[];
    },
  });

  const totalClimbs = sends?.length ?? 0;
  const grades = (sends ?? []).map((s) => s.route?.grade).filter((g): g is RouteGrade => !!g);
  const highestGrade = getHighestGrade(grades);
  const climbsThisMonth = (sends ?? []).filter((s) => isThisMonth(s.date_completed)).length;
  const climbsPerGrade = GRADE_ORDER.map((grade) => ({
    grade,
    count: grades.filter((g) => g === grade).length,
  })).filter((row) => row.count > 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.username}!</h1>
        <p className="text-gray-500 mt-1">Track your climbing progress and connect with the community</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Stats at a glance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-light">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Mountain className="w-4 h-4" />
              Total climbs
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalClimbs}</div>
          </div>
          <div className="card-light">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Award className="w-4 h-4" />
              Highest grade
            </div>
            <div className="text-2xl font-bold text-gray-900">{highestGrade ?? '—'}</div>
          </div>
          <div className="card-light">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Climbs this month
            </div>
            <div className="text-2xl font-bold text-gray-900">{climbsThisMonth}</div>
          </div>
          <div className="card-light">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Flame className="w-4 h-4" />
              Weekly streak
            </div>
            <div className="text-2xl font-bold text-gray-900">—</div>
          </div>
        </div>
      </section>

      <section className="card-light">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Recent activity</h2>
        {sendsLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : !sends || sends.length === 0 ? (
          <p className="text-gray-500 text-sm">No climbs logged yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sends.slice(0, 5).map((send) => (
              <li key={send.id} className="py-3 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    Sent{' '}
                    <span className="font-medium">{send.route?.route_name ?? 'Unknown route'}</span>
                  </p>
                  <p className="text-xs text-gray-500">{send.route?.gym?.gym_name}</p>
                  {send.route?.grade && (
                    <span className="badge bg-gray-100 text-gray-700 mt-1.5">{send.route.grade}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(send.date_completed).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid sm:grid-cols-2 gap-6">
        <section className="card-light">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Climbs per grade</h2>
          {climbsPerGrade.length === 0 ? (
            <p className="text-gray-500 text-sm">No sends logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={climbsPerGrade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="grade" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  labelStyle={{ color: '#111827' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="card-light">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Current goals
          </h2>
          <p className="text-gray-500 text-sm">Goal tracking is coming soon.</p>
        </section>
      </div>

      <section className="card-light">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Uploaded beta</h2>
        {betasLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : !betas || betas.length === 0 ? (
          <p className="text-gray-500 text-sm">No beta uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {betas.map((beta) => (
              <li key={beta.id} className="py-2 text-sm">
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  {beta.route?.route_name ?? 'Unknown route'}
                </div>
                {beta.description_text && (
                  <p className="text-gray-500 mt-1 ml-6">{beta.description_text}</p>
                )}
                {beta.video_url && (
                  <a
                    href={beta.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 text-xs hover:underline ml-6"
                  >
                    View video
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-light">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Recommended routes
        </h2>
        <p className="text-gray-500 text-sm">Route recommendations are coming soon.</p>
      </section>
    </div>
  );
}
