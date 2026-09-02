import { useQuery } from '@tanstack/react-query';
import { useState, type CSSProperties } from 'react';
import {
  ChevronDown,
  Flame,
  MapPin,
  MessageSquare,
  Mountain,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/auth';
import { GRADE_ORDER, GRADE_SWATCH_BORDER, getGradeColorHex, getHighestGrade } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { RouteGrade } from '../types';

interface SendRow {
  id: number;
  date_completed: string;
  route: {
    id: number;
    route_name: string;
    grade: RouteGrade;
    styles: string[];
    gym: { gym_name: string; slug: string } | null;
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

function isWithinLastMonths(dateStr: string, months: number) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return new Date(dateStr) >= cutoff;
}

type GradePeriod = 'week' | 'month' | '3months' | 'all';

const GRADE_PERIOD_OPTIONS: { value: GradePeriod; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'all', label: 'All Time' },
];

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

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 35) {
    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getStatValueClass(value: string | number, muted?: boolean): string {
  if (muted) return 'text-sm font-semibold text-gray-400 truncate';
  const length = String(value).length;
  if (length > 14) return 'text-lg font-extrabold tracking-tight text-gray-900 truncate';
  if (length > 10) return 'text-2xl font-extrabold tracking-tight text-gray-900 truncate';
  return 'text-3xl font-extrabold tracking-tight text-gray-900 truncate';
}

function getGradeSolidBadgeProps(grade: RouteGrade): { className: string; style?: CSSProperties } {
  if (grade === 'V0') {
    return { className: 'bg-slate-100 text-slate-700 border border-slate-200' };
  }
  return { className: 'text-white', style: { backgroundColor: getGradeColorHex(grade) } };
}

export function Dashboard() {
  const { user, profile, gymMemberships, homeGym } = useAuth();
  const [gradePeriod, setGradePeriod] = useState<GradePeriod>('month');
  const [gradePeriodMenuOpen, setGradePeriodMenuOpen] = useState(false);

  const { data: sends, isLoading: sendsLoading } = useQuery({
    queryKey: ['sends', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sends')
        .select('id, date_completed, route:routes(id, route_name, grade, styles, gym:gyms(gym_name, slug))')
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
  let mostFrequentGym: string | null = null;
  let mostFrequentGymCount = 0;
  for (const [name, count] of gymSendCounts) {
    if (count > mostFrequentGymCount) {
      mostFrequentGym = name;
      mostFrequentGymCount = count;
    }
  }
  const activeGym = homeGym?.gym_name ?? mostFrequentGym;

  const periodSends = (sends ?? []).filter((s) => {
    if (gradePeriod === 'week') return isThisWeek(s.date_completed);
    if (gradePeriod === 'month') return isThisMonth(s.date_completed);
    if (gradePeriod === '3months') return isWithinLastMonths(s.date_completed, 3);
    return true;
  });
  const chartGrades = periodSends.map((s) => s.route?.grade).filter((g): g is RouteGrade => !!g);
  const highestChartGrade = getHighestGrade(chartGrades);
  const highestGradeIndex = highestChartGrade ? GRADE_ORDER.indexOf(highestChartGrade) : -1;
  const chartMaxIndex =
    highestGradeIndex >= 0 ? Math.min(highestGradeIndex + 2, GRADE_ORDER.length - 1) : GRADE_ORDER.length - 1;
  const climbsPerGrade = GRADE_ORDER.slice(0, chartMaxIndex + 1).map((grade) => ({
    grade,
    count: chartGrades.filter((g) => g === grade).length,
  }));

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;
  const roleLabel = profile?.is_platform_admin
    ? 'Platform admin'
    : gymMemberships.length > 0
      ? `${gymMemberships.length} gym${gymMemberships.length > 1 ? 's' : ''} managed`
      : 'Climber';

  const statTiles: {
    label: string;
    value: string | number;
    caption?: string;
    icon: typeof Trophy;
    tint: string;
    iconTint: string;
    chipBg: string;
    muted?: boolean;
  }[] = [
    {
      label: 'Hardest Climb',
      value: highestGrade ?? '—',
      icon: Trophy,
      tint: 'bg-amber-50 border-amber-100',
      iconTint: 'text-amber-600',
      chipBg: 'bg-amber-500/15',
    },
    {
      label: 'Total Sends',
      value: totalClimbs,
      icon: Mountain,
      tint: 'bg-blue-50 border-blue-100',
      iconTint: 'text-blue-600',
      chipBg: 'bg-blue-500/15',
    },
    {
      label: 'Current Streak',
      value: weeklyStreak > 0 ? `${weeklyStreak} wk${weeklyStreak > 1 ? 's' : ''}` : '0 days',
      caption: weeklyStreak === 0 ? 'Start your streak today' : undefined,
      icon: Flame,
      tint: 'bg-orange-50 border-orange-100',
      iconTint: 'text-orange-600',
      chipBg: 'bg-orange-500/15',
      muted: weeklyStreak === 0,
    },
    {
      label: 'Home Gym',
      value: activeGym ?? '—',
      icon: MapPin,
      tint: 'bg-teal-50 border-teal-100',
      iconTint: 'text-teal-600',
      chipBg: 'bg-teal-500/15',
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-surface-900 px-6 sm:px-8 py-4 sm:py-5 overflow-hidden">
          <div className="absolute -top-16 -left-10 w-48 h-48 bg-brand-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-16 right-0 w-56 h-56 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none text-white/[0.05]"
            style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.username}
                size={48}
                className="shrink-0 ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-900"
              />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{profile?.username}</h1>
                <p className="text-sm text-slate-300 truncate">
                  {roleLabel}
                  {memberSince && <> · Member since {memberSince}</>}
                </p>
              </div>
            </div>

            <Link
              to={homeGym ? `/gyms/${homeGym.slug}` : '/gyms'}
              className="inline-flex items-center justify-center gap-2 rounded-full shrink-0 bg-brand-500 text-white font-bold py-2.5 px-5 shadow-sm shadow-brand-900/30 hover:bg-brand-600 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Log a Send</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5">
          {statTiles.map(({ label, value, caption, icon: Icon, tint, iconTint, chipBg, muted }) => (
            <div key={label} className={`flex flex-col justify-between rounded-xl border p-4 ${tint}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${chipBg}`}>
                  <Icon className={`w-4 h-4 ${iconTint}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </div>
              <div
                className={getStatValueClass(value, muted)}
                title={typeof value === 'string' ? value : undefined}
              >
                {value}
              </div>
              {caption && <p className="text-xs text-gray-400 mt-0.5 truncate">{caption}</p>}
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-stretch">
        <div className="space-y-6">
          <section className="card-light">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Grade Distribution</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGradePeriodMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {GRADE_PERIOD_OPTIONS.find((o) => o.value === gradePeriod)?.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {gradePeriodMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setGradePeriodMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-50">
                      {GRADE_PERIOD_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setGradePeriod(option.value);
                            setGradePeriodMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                            option.value === gradePeriod ? 'text-brand-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {chartGrades.length === 0 ? (
              <p className="text-gray-500 text-sm">No sends logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={climbsPerGrade} margin={{ top: 8, right: 28, left: 0, bottom: 0 }} barSize={36}>
                  <defs>
                    {climbsPerGrade.map((row) => {
                      const hex = getGradeColorHex(row.grade);
                      return (
                        <linearGradient key={row.grade} id={`gradeGrad-${row.grade}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={hex} stopOpacity={1} />
                          <stop offset="100%" stopColor={hex} stopOpacity={0.55} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="grade" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                    labelStyle={{ color: '#111827' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {climbsPerGrade.map((row) => (
                      <Cell
                        key={row.grade}
                        fill={`url(#gradeGrad-${row.grade})`}
                        stroke={row.count > 0 ? GRADE_SWATCH_BORDER : 'none'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="card-light">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Uploaded beta</h2>
            {betasLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : !betas || betas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
                  <Video className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No beta uploaded yet</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Share a video or write-up from any route page to help other climbers send it.
                </p>
              </div>
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
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-6 px-4">
              <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-brand-600" />
              </div>
              <p className="text-gray-500 text-sm">Route recommendations are coming soon.</p>
            </div>
          </section>
        </div>

        <section className="card-light flex flex-col lg:sticky lg:top-6">
          <div>
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
          </div>

          <div className="pt-6 mt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recent activity</h2>
            {sendsLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : !sends || sends.length === 0 ? (
              <p className="text-gray-500 text-sm">No climbs logged yet.</p>
            ) : (
              <div className="space-y-2">
                {sends.slice(0, 5).map((send) => {
                  const rowContent = (
                    <>
                      {send.route?.grade ? (
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getGradeSolidBadgeProps(send.route.grade).className}`}
                          style={getGradeSolidBadgeProps(send.route.grade).style}
                        >
                          {send.route.grade}
                        </span>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs text-gray-400">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {send.route?.route_name ?? 'Unknown route'}
                        </p>
                        {send.route?.styles && send.route.styles.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {send.route.styles.slice(0, 2).map((style) => (
                              <span key={style} className="badge bg-gray-100 text-gray-600 shrink-0">
                                {style}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-1 shrink-0 text-right">
                        <span className="text-xs text-gray-400">{formatRelativeDate(send.date_completed)}</span>
                        {send.route?.gym?.gym_name && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {send.route.gym.gym_name}
                          </span>
                        )}
                      </div>
                    </>
                  );
                  const rowClasses =
                    'flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 hover:border-slate-300 hover:bg-slate-50/50 transition-all';
                  const gymSlug = send.route?.gym?.slug;
                  const routeId = send.route?.id;

                  if (gymSlug && routeId) {
                    return (
                      <Link
                        key={send.id}
                        to={`/gyms/${gymSlug}/climbs/${routeId}`}
                        className={`${rowClasses} cursor-pointer`}
                      >
                        {rowContent}
                      </Link>
                    );
                  }
                  return (
                    <div key={send.id} className={rowClasses}>
                      {rowContent}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-gray-200 flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-600" />
              Current goals
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-5 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-brand-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Goal tracking is coming soon</p>
              <p className="text-xs text-gray-400 mt-1">
                Set monthly grade targets and watch your progress bar fill in as you send.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
