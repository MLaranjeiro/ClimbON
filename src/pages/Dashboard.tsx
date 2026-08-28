import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Flame, MapPin, MessageSquare, Mountain, Sparkles, Target, Trophy } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/auth';
import {
  GRADE_ORDER,
  GRADE_SWATCH_BORDER,
  getGradeBadgeClasses,
  getGradeColorHex,
  getHighestGrade,
} from '../lib/grades';
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

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function isThisWeek(dateStr: string) {
  return getWeekStart(new Date(dateStr)) === getWeekStart(new Date());
}

function computeWeeklyStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const weeks = new Set(dates.map((d) => getWeekStart(new Date(d))));
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  let streak = 0;
  let cursor = getWeekStart(new Date());
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= weekMs;
  }
  return streak;
}

export function Dashboard() {
  const { user, profile, gymMemberships } = useAuth();

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
  const climbsThisWeek = (sends ?? []).filter((s) => isThisWeek(s.date_completed)).length;
  const gradesThisWeek = (sends ?? [])
    .filter((s) => isThisWeek(s.date_completed))
    .map((s) => s.route?.grade)
    .filter((g): g is RouteGrade => !!g);
  const highestGradeThisWeek = getHighestGrade(gradesThisWeek);
  const climbsThisMonth = (sends ?? []).filter((s) => isThisMonth(s.date_completed)).length;
  const gradesThisMonth = (sends ?? [])
    .filter((s) => isThisMonth(s.date_completed))
    .map((s) => s.route?.grade)
    .filter((g): g is RouteGrade => !!g);
  const highestGradeThisMonth = getHighestGrade(gradesThisMonth);
  const weeklyStreak = computeWeeklyStreak((sends ?? []).map((s) => s.date_completed));

  const gymSendCounts = new Map<string, number>();
  for (const s of sends ?? []) {
    const name = s.route?.gym?.gym_name;
    if (name) gymSendCounts.set(name, (gymSendCounts.get(name) ?? 0) + 1);
  }
  let activeGym: string | null = null;
  let activeGymCount = 0;
  for (const [name, count] of gymSendCounts) {
    if (count > activeGymCount) {
      activeGym = name;
      activeGymCount = count;
    }
  }
  const climbsPerGrade = GRADE_ORDER.map((grade) => ({
    grade,
    count: grades.filter((g) => g === grade).length,
  })).filter((row) => row.count > 0);

  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;
  const roleLabel = profile?.is_platform_admin
    ? 'Platform admin'
    : gymMemberships.length > 0
      ? `${gymMemberships.length} gym${gymMemberships.length > 1 ? 's' : ''} managed`
      : 'Climber';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-brand-700">{initial}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile?.username}</h1>
              <p className="text-sm text-gray-500">
                {roleLabel}
                {memberSince && <> · Member since {memberSince}</>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:ml-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-gray-500 text-xs">Hardest Climb</div>
                <div className="text-xl font-bold text-gray-900">{highestGrade ?? '—'}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:border-l sm:border-gray-200 sm:pl-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <Mountain className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Total Sends</div>
                  <div className="text-xl font-bold text-gray-900">{totalClimbs}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Current Streak</div>
                  <div className="text-xl font-bold text-gray-900">{weeklyStreak}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Active Gym</div>
                  <div className="text-xl font-bold text-gray-900 truncate max-w-[10rem]">{activeGym ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <section className="card-light">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recent activity</h2>
            {sendsLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : !sends || sends.length === 0 ? (
              <p className="text-gray-500 text-sm">No climbs logged yet.</p>
            ) : (
              <div className="space-y-2">
                {sends.slice(0, 5).map((send) => (
                  <div
                    key={send.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:border-gray-300 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-900 w-32 sm:w-44 shrink-0 truncate">
                      <span className="font-semibold">{send.route?.route_name ?? 'Unknown route'}</span>
                    </p>
                    {send.route?.grade && (
                      <span className={`badge shrink-0 ${getGradeBadgeClasses(send.route.grade)}`}>
                        {send.route.grade}
                      </span>
                    )}
                    {send.route?.gym?.gym_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0 ml-auto">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {send.route.gym.gym_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

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
              <Sparkles className="w-4 h-4 text-brand-600" />
              Recommended routes
            </h2>
            <p className="text-gray-500 text-sm">Route recommendations are coming soon.</p>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <section className="card-light">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">This Week</h3>
            <dl className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Climbs</dt>
                <dd className="font-semibold text-gray-900">{climbsThisWeek}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Highest grade</dt>
                <dd className="font-semibold text-gray-900">{highestGradeThisWeek ?? '—'}</dd>
              </div>
            </dl>

            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pt-3 border-t border-gray-200">
              This Month
            </h3>
            <dl className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Climbs</dt>
                <dd className="font-semibold text-gray-900">{climbsThisMonth}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Highest grade</dt>
                <dd className="font-semibold text-gray-900">{highestGradeThisMonth ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="card-light">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Climbs per grade</h2>
            {climbsPerGrade.length === 0 ? (
              <p className="text-gray-500 text-sm">No sends logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={climbsPerGrade}>
                  <XAxis dataKey="grade" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    labelStyle={{ color: '#111827' }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {climbsPerGrade.map((row) => (
                      <Cell key={row.grade} fill={getGradeColorHex(row.grade)} stroke={GRADE_SWATCH_BORDER} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="card-light">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-600" />
              Current goals
            </h2>
            <p className="text-gray-500 text-sm">Goal tracking is coming soon.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
