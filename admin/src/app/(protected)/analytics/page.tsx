'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { AreaChart } from '@/components/charts/area-chart';
import { BarChart } from '@/components/charts/bar-chart';
import {
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Hash,
  Flame,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  '#f97316', '#6366f1', '#10b981', '#3b82f6',
  '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16',
];

const PERIODS = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArray(d: unknown): any[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object' && Array.isArray((d as any).data)) return (d as any).data;
  return [];
}

function calcTrend(data: any[], key: string): number {
  if (data.length < 2) return 0;
  const mid = Math.floor(data.length / 2);
  const first = data.slice(0, mid).reduce((s, d) => s + (Number(d[key]) || 0), 0);
  const second = data.slice(mid).reduce((s, d) => s + (Number(d[key]) || 0), 0);
  if (first === 0) return second > 0 ? 100 : 0;
  return Math.round(((second - first) / first) * 100);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PeriodTabs({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 gap-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
            value === p.value
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
      <Minus className="h-2.5 w-2.5" /> Stable
    </span>
  );
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
    }`}>
      {up
        ? <ArrowUpRight className="h-2.5 w-2.5" />
        : <ArrowDownRight className="h-2.5 w-2.5" />}
      {Math.abs(value)}%
    </span>
  );
}

function MetricCard({
  icon, label, value, sublabel, trend, color, iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  trend?: number;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      {/* Decorative orb */}
      <div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.07] transition-transform duration-500 group-hover:scale-150"
        style={{ background: color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-gray-900">{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-gray-500">{label}</p>
        {sublabel && (
          <p className="mt-1 text-[10px] text-gray-400">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title, subtitle, iconBg, icon, children, action,
}: {
  title: string;
  subtitle: string;
  iconBg: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {/* Body */}
      <div className="p-4 pt-3">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ height = 200, message = 'No data available' }: { height?: number; message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50"
      style={{ height }}
    >
      <BarChart3 className="h-8 w-8 text-gray-200" />
      <p className="text-sm font-medium text-gray-400">{message}</p>
    </div>
  );
}

function SkeletonPulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [userPeriod, setUserPeriod] = useState('daily');
  const [jaapPeriod, setJaapPeriod] = useState('daily');

  const { data: userGrowth, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['analytics-users', userPeriod],
    queryFn: () => analyticsApi.getUserGrowth({ period: userPeriod }),
  });

  const { data: jaapActivity, isLoading: loadingJaap, refetch: refetchJaap } = useQuery({
    queryKey: ['analytics-jaap', jaapPeriod],
    queryFn: () => analyticsApi.getJaapActivity({ period: jaapPeriod }),
  });

  const { data: contentData, isLoading: loadingContent } = useQuery({
    queryKey: ['analytics-content'],
    queryFn: () => analyticsApi.getContentAnalytics(),
  });

  const { data: ageGroupData, isLoading: loadingAgeGroups, refetch: refetchAgeGroups } = useQuery({
    queryKey: ['analytics-age-groups'],
    queryFn: () => analyticsApi.getAgeGroups(),
  });

  const { data: deityJaapData, isLoading: loadingDeityJaap, refetch: refetchDeityJaap } = useQuery({
    queryKey: ['analytics-deity-jaap'],
    queryFn: () => analyticsApi.getDeityJaapAnalytics({ limit: 50 }),
  });

  const isLoading = loadingUsers || loadingJaap;

  const handleRefreshAll = () => {
    refetchUsers();
    refetchJaap();
    refetchAgeGroups();
    refetchDeityJaap();
  };

  // ── Transform ──
  // Robustly extract data arrays and objects from Axios responses
  const userGrowthData = toArray(userGrowth?.data ?? userGrowth);
  const jaapActivityData = toArray(jaapActivity?.data ?? jaapActivity);
  
  // Content analytics might be unwrapped by interceptor or still in .data
  const contentRaw = contentData?.data ?? contentData;
  const contentAnalytics = (contentRaw && typeof contentRaw === 'object') ? contentRaw : {} as any;
  
  // Deity list transform
  const deityJaapRaw = deityJaapData?.data ?? deityJaapData;
  const deityJaapList: any[] = Array.isArray(deityJaapRaw) ? deityJaapRaw : [];

  const userChartData = userGrowthData.map((d: any) => ({ x: d._id || '', y: Number(d.count) || 0 }));

  // The backend returns { ageGroups, totalUsers, usersWithDob }.
  const ageGroupsRaw = ageGroupData?.data ?? ageGroupData;
  const ageGroups: { ageGroup: string; count: number }[] = Array.isArray(ageGroupsRaw)
    ? ageGroupsRaw
    : Array.isArray(ageGroupsRaw?.ageGroups)
      ? ageGroupsRaw.ageGroups
      : [];
  const totalUsersFromAge: number = (ageGroupsRaw as any)?.totalUsers ?? 0;
  const usersWithDob: number =
    (ageGroupsRaw as any)?.usersWithDob ??
    ageGroups.filter((g) => g.ageGroup !== 'No DOB').reduce((s, d) => s + d.count, 0);
  const noDobCount = ageGroups.find((g) => g.ageGroup === 'No DOB')?.count ?? 0;
  const totalWithDob = usersWithDob;

  // ── KPI Numbers ──
  const totalNewUsers = userGrowthData.reduce((sum: number, d: any) => sum + (Number(d.count) || 0), 0);
  const totalSessions = jaapActivityData.reduce((sum: number, d: any) => sum + (Number(d.sessions) || 0), 0);
  const totalBeads = jaapActivityData.reduce((sum: number, d: any) => sum + (Number(d.totalBeads) || 0), 0);
  const avgBeadsPerSession = totalSessions > 0 ? Math.round(totalBeads / totalSessions) : 0;

  const userTrend = calcTrend(userGrowthData, 'count');
  const sessionTrend = calcTrend(jaapActivityData, 'sessions');
  const beadTrend = calcTrend(jaapActivityData, 'totalBeads');

  // Content stats - prioritize totalMantras/totalDeities from the new response shape
  const totalMantras = contentAnalytics?.totalMantras ?? contentAnalytics?.mantras ?? 0;
  const totalDeities = contentAnalytics?.totalDeities ?? contentAnalytics?.deities ?? 0;

  // ── Render ──
  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-pink-500 to-violet-600 p-5 text-white shadow-lg shadow-rose-200">
        {/* Decorative */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-40 h-20 w-20 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute right-10 top-4 select-none text-8xl font-black leading-none text-white/10">ॐ</span>

        {/* Row */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm ring-1 ring-white/30">
              <BarChart3 className="h-6 w-6 text-white drop-shadow" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">Analytics</h1>
              <p className="mt-0.5 text-xs text-rose-100/90">
                Real-time insights &middot; data syncs from app automatically
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm ring-1 ring-white/30 transition-all hover:bg-white/30 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>

        {/* Quick stat strip */}
        <div className="relative mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[
            { label: 'New Users', value: formatNumber(totalNewUsers), icon: '👤' },
            { label: 'Sessions',  value: formatNumber(totalSessions),  icon: '📿' },
            { label: 'Beads',     value: formatNumber(totalBeads),     icon: '🔢' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 overflow-hidden rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{s.label}</span>
              <span className="text-xl font-black tracking-tight text-white leading-none">
                {isLoading ? '...' : s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Users className="h-5 w-5 text-white" />}
            label="New Users"
            value={formatNumber(totalNewUsers)}
            sublabel={`${userPeriod} view`}
            trend={userTrend}
            color="#f97316"
            iconBg="linear-gradient(135deg,#f97316,#fb923c)"
          />
          <MetricCard
            icon={<Activity className="h-5 w-5 text-white" />}
            label="Jaap Sessions"
            value={formatNumber(totalSessions)}
            sublabel={`${jaapPeriod} view`}
            trend={sessionTrend}
            color="#6366f1"
            iconBg="linear-gradient(135deg,#6366f1,#818cf8)"
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            label="Total Beads"
            value={formatNumber(totalBeads)}
            sublabel="Accumulated this period"
            trend={beadTrend}
            color="#10b981"
            iconBg="linear-gradient(135deg,#10b981,#34d399)"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5 text-white" />}
            label="Avg Beads / Session"
            value={formatNumber(avgBeadsPerSession)}
            sublabel="Engagement depth"
            color="#8b5cf6"
            iconBg="linear-gradient(135deg,#8b5cf6,#a78bfa)"
          />
        </div>
      )}

      {/* ── Content Summary mini-row ── */}
      {!loadingContent && (totalMantras > 0 || totalDeities > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              label: 'Total Mantras',
              value: formatNumber(totalMantras),
              icon: <Layers className="h-4 w-4 text-violet-600" />,
              bg: 'bg-violet-50 border-violet-100',
            },
            {
              label: 'Total Deities',
              value: formatNumber(totalDeities),
              icon: <CheckCircle2 className="h-4 w-4 text-orange-600" />,
              bg: 'bg-orange-50 border-orange-100',
            },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-3 rounded-xl border p-3 ${item.bg}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                {item.icon}
              </div>
              <div>
                <p className="text-lg font-black text-gray-900">{item.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── User Growth Chart ── */}
      <ChartCard
        title="User Growth"
        subtitle="New registrations tracked over time"
        iconBg="linear-gradient(135deg,#f97316,#fb923c)"
        icon={<TrendingUp className="h-4 w-4 text-white" />}
        action={
          <PeriodTabs
            value={userPeriod}
            onChange={(v) => setUserPeriod(v)}
          />
        }
      >
        {loadingUsers ? (
          <SkeletonPulse className="h-64 w-full" />
        ) : userChartData.length > 0 ? (
          <>
            {/* Mini summary bar */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-orange-50 border border-orange-100 px-4 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Total</p>
                <p className="text-base font-black text-orange-700">{formatNumber(totalNewUsers)}</p>
              </div>
              <div className="h-8 w-px bg-orange-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Trend (2nd half)</p>
                <TrendBadge value={userTrend} />
              </div>
              <div className="h-8 w-px bg-orange-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Data Points</p>
                <p className="text-sm font-bold text-orange-700">{userChartData.length}</p>
              </div>
            </div>
            <AreaChart
              data={userChartData}
              color="#ea580c"
              gradientId="user-growth-grad"
              height={300}
            />
          </>
        ) : (
          <EmptyState message="No user data for this period" />
        )}
      </ChartCard>

      {/* ── Jaap Activity Chart ── */}
      <ChartCard
        title="Jaap Activity"
        subtitle="Sessions & beads tracked over time"
        iconBg="linear-gradient(135deg,#6366f1,#818cf8)"
        icon={<Activity className="h-4 w-4 text-white" />}
        action={
          <PeriodTabs
            value={jaapPeriod}
            onChange={(v) => setJaapPeriod(v)}
          />
        }
      >
        {loadingJaap ? (
          <SkeletonPulse className="h-64 w-full" />
        ) : jaapActivityData.length > 0 ? (
          <>
            {/* Mini summary bar */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Sessions</p>
                <p className="text-base font-black text-indigo-700">{formatNumber(totalSessions)}</p>
              </div>
              <div className="h-8 w-px bg-indigo-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Beads</p>
                <p className="text-base font-black text-indigo-700">{formatNumber(totalBeads)}</p>
              </div>
              <div className="h-8 w-px bg-indigo-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Avg Beads/Session</p>
                <p className="text-base font-black text-indigo-700">{formatNumber(avgBeadsPerSession)}</p>
              </div>
            </div>
            <BarChart
              data={jaapActivityData}
              xKey="_id"
              series={[
                { dataKey: 'sessions',   color: '#6366f1', label: 'Sessions' },
                { dataKey: 'totalBeads', color: '#f97316', label: 'Beads' },
              ]}
              height={300}
            />
          </>
        ) : (
          <EmptyState message="No activity data for this period" />
        )}
      </ChartCard>

      {/* ── Audience Age Group Bar Chart ── */}
      <ChartCard
        title="Audience Age Groups"
        subtitle="All users distributed by age calculated from date of birth"
        iconBg="linear-gradient(135deg,#f43f5e,#fb7185)"
        icon={<Users className="h-4 w-4 text-white" />}
      >
        {loadingAgeGroups ? (
          <SkeletonPulse className="h-72 w-full" />
        ) : ageGroups.length > 0 ? (
          <div className="space-y-3">
            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Total Users</p>
                <p className="text-base font-black text-rose-700">{formatNumber(totalUsersFromAge)}</p>
              </div>
              <div className="h-8 w-px bg-rose-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Users with DOB</p>
                <p className="text-base font-black text-rose-700">{formatNumber(totalWithDob)}</p>
              </div>
              <div className="h-8 w-px bg-rose-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">No DOB recorded</p>
                <p className="text-base font-black text-rose-700">{formatNumber(noDobCount)}</p>
              </div>
            </div>
            {/* ECharts bar graph */}
            <BarChart
              data={ageGroups.map((g) => ({ ageGroup: g.ageGroup, count: g.count }))}
              xKey="ageGroup"
              series={[{ dataKey: 'count', color: '#f43f5e', label: 'Users' }]}
              height={320}
            />
          </div>
        ) : (
          <EmptyState height={200} message="No age data available yet" />
        )}
      </ChartCard>

      {/* ── Top Deity Jaap Section ── */}
      <ChartCard
        title="Top Deities Jaap"
        subtitle="Ranked by total beads chanted per deity across all users"
        iconBg="linear-gradient(135deg,#f59e0b,#f97316)"
        icon={<Star className="h-4 w-4 text-white" />}
      >
        {loadingDeityJaap ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded-full bg-gray-100" />
                  <div className="h-2 rounded-full bg-gray-100" style={{ width: `${80 - i * 12}%` }} />
                </div>
                <div className="h-4 w-12 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        ) : deityJaapList.length > 0 ? (
          <div className="space-y-1">
            {/* Summary strip */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Deities Tracked</p>
                <p className="text-base font-black text-amber-700">{deityJaapList.length}</p>
              </div>
              <div className="h-8 w-px bg-amber-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Total Beads</p>
                <p className="text-base font-black text-amber-700">
                  {formatNumber(deityJaapList.reduce((s, d) => s + (d.totalBeads || 0), 0))}
                </p>
              </div>
              <div className="h-8 w-px bg-amber-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Total Sessions</p>
                <p className="text-base font-black text-amber-700">
                  {formatNumber(deityJaapList.reduce((s, d) => s + (d.totalSessions || 0), 0))}
                </p>
              </div>
            </div>

            {/* Deities Graph */}
            <div className="mb-6 rounded-xl border border-amber-100 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.1)]">
              <BarChart
                data={deityJaapList.slice(0, 5).map((d: any) => ({ name: d.deityName || 'Unknown', beads: d.totalBeads || 0 }))}
                xKey="name"
                series={[{ dataKey: 'beads', color: '#f59e0b', label: 'Total Beads' }]}
                height={280}
              />
            </div>

            {deityJaapList.map((deity: any, idx: number) => {
              const initials = (deity.deityName || 'U').slice(0, 2).toUpperCase();
              const GRAD_COLORS = [
                'from-orange-500 to-amber-400',
                'from-violet-500 to-purple-500',
                'from-blue-500 to-cyan-400',
                'from-rose-500 to-pink-400',
                'from-teal-500 to-emerald-400',
                'from-indigo-500 to-blue-400',
                'from-amber-500 to-yellow-400',
                'from-red-500 to-orange-400',
                'from-sky-500 to-blue-400',
                'from-green-500 to-teal-400',
              ];
              const grad = GRAD_COLORS[idx % GRAD_COLORS.length];
              return (
                <div
                  key={deity._id}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-gray-50"
                >
                  {/* Rank */}
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                    idx === 0 ? 'bg-amber-400 text-white shadow-sm shadow-amber-300'
                    : idx === 1 ? 'bg-gray-300 text-white'
                    : idx === 2 ? 'bg-orange-400 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Deity avatar */}
                  <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-sm ${!deity.deityImage ? `bg-gradient-to-br ${grad}` : ''}`}>
                    {deity.deityImage ? (
                      <img
                        src={deity.deityImage}
                        alt={deity.deityName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.style.display = 'none';
                          const p = t.parentElement;
                          if (p) {
                            p.className += ` bg-gradient-to-br ${grad}`;
                            p.innerHTML = `<span class="flex h-full w-full items-center justify-center text-sm font-black text-white">${initials}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-black text-white">{initials}</span>
                    )}
                    {/* Rank crown for #1 */}
                    {idx === 0 && (
                      <span className="absolute -right-0.5 -top-0.5 text-[10px]">👑</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{deity.deityName}</p>
                        {deity.deityNameHi && (
                          <p className="text-[10px] text-gray-400">{deity.deityNameHi}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                        {deity.sharePercent}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                        style={{ width: `${deity.sharePercent}%` }}
                      />
                    </div>

                    {/* Stats row */}
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                        <Hash className="h-2.5 w-2.5" />
                        {formatNumber(deity.totalBeads)} beads
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-500">
                        <Flame className="h-2.5 w-2.5" />
                        {formatNumber(deity.totalSessions)} sessions
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                        <Users className="h-2.5 w-2.5" />
                        {formatNumber(deity.uniqueUsers)} users
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState height={200} message="No deity jaap data available yet" />
        )}
      </ChartCard>

      {/* ── Footer note ── */}
      <div className="flex items-center justify-center gap-2 pb-2">
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Live data from backend
        </span>
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </div>
  );
}
