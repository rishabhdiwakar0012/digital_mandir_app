'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { DashboardOverview } from '@/lib/types';
import { AreaChart } from '@/components/charts/area-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { Sparkline } from '@/components/charts/sparkline';
import {
  Users, UserCheck, UserPlus, BookOpen, Bell, Activity,
  TrendingUp, ArrowUpRight, ArrowRight, Smartphone,
  RefreshCw, Star, ZapIcon, ChevronRight, Trophy, Globe2,
  CircleDot, CalendarDays, Medal, Send, BarChart2, Settings2,
  Layers, Flame, TrendingDown, Minus, Sparkles, Clock,
} from 'lucide-react';

const DEVICE_COLORS = ['#f97316', '#6366f1', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6'];
const BAR_COLORS   = ['#f97316', '#6366f1', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#06b6d4'];
const PERIOD_OPTIONS = [{ label: '7D', days: 7 }, { label: '14D', days: 14 }, { label: '30D', days: 30 }];

function toArray(d: unknown): any[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object' && Array.isArray((d as any).data)) return (d as any).data;
  return [];
}
function toObj(d: unknown): any {
  if (!d) return {};
  if (typeof d === 'object' && 'data' in (d as any) && typeof (d as any).data === 'object' && !Array.isArray((d as any).data)) return (d as any).data;
  if (typeof d === 'object' && !Array.isArray(d)) return d;
  return {};
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Skeleton helpers ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="h-[3px] w-full bg-linear-to-r from-gray-100 via-gray-200 to-gray-100" />
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-gray-100" />
          <div className="h-4 w-10 rounded-full bg-gray-100" />
        </div>
        <div className="h-2 w-16 rounded-full bg-gray-100 mb-1.5" />
        <div className="h-7 w-14 rounded-lg bg-gray-100" />
        <div className="mt-2 h-1.5 w-12 rounded-full bg-gray-100" />
        <div className="mt-3 h-0.5 w-full rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <div className="animate-pulse px-4 pb-4 pt-2">
      <div className="overflow-hidden rounded-2xl bg-linear-to-b from-gray-50 to-gray-100/40" style={{ height }}>
        <div className="flex h-full items-end gap-1.5 px-5 pb-5">
          {[55, 75, 45, 88, 65, 50, 80, 60, 72, 48, 85, 63].map((v, i) => (
            <div key={i} className="flex-1 rounded-t-lg bg-gray-200/60" style={{ height: `${v}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Trend pill ────────────────────────────────────────────────── */
function Trend({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-100">
      <TrendingUp className="h-2.5 w-2.5" />+{value}%
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-500 ring-1 ring-red-100">
      <TrendingDown className="h-2.5 w-2.5" />{value}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-400">
      <Minus className="h-2.5 w-2.5" />0%
    </span>
  );
}

/* ─── Rank badge ────────────────────────────────────────────────── */
function RankBadge({ rank }: { rank: number }) {
  const confMap: Record<number, string> = {
    1: 'bg-linear-to-br from-yellow-300 to-amber-500 shadow-amber-300/50',
    2: 'bg-linear-to-br from-slate-300 to-slate-400 shadow-slate-300/50',
    3: 'bg-linear-to-br from-orange-300 to-amber-600 shadow-amber-400/50',
  };
  const cls = confMap[rank] ?? 'bg-gray-100';
  const textCls = rank <= 3 ? 'text-white shadow-sm' : 'text-gray-500';
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${cls} ${textCls}`}>
      {rank}
    </span>
  );
}

/* ─── Section label ─────────────────────────────────────────────── */
function SectionLabel({ children, color = 'bg-orange-500' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className={`h-4 w-1.5 rounded-full ${color}`} />
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{children}</span>
      <span className="h-px flex-1 rounded-full bg-linear-to-r from-gray-200/80 to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [userPeriod, setUserPeriod] = useState(30);
  const [jaapDays, setJaapDays] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dashData, isLoading: loadingDash } = useQuery<any>({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  });
  const { data: userGrowth, isLoading: loadingUsers } = useQuery<any>({
    queryKey: ['analytics-users', 'daily', userPeriod],
    queryFn: () => analyticsApi.getUserGrowth({ period: 'daily', days: userPeriod }),
  });
  const { data: jaapActivity, isLoading: loadingJaap } = useQuery<any>({
    queryKey: ['analytics-jaap', jaapDays],
    queryFn: () => analyticsApi.getJaapActivity({ days: jaapDays }),
  });
  const { data: deviceBreakdown, isLoading: loadingDevices } = useQuery<any>({
    queryKey: ['analytics-devices'],
    queryFn: () => analyticsApi.getDeviceBreakdown(),
  });
  const { data: contentAnalytics } = useQuery<any>({
    queryKey: ['analytics-content'],
    queryFn: () => analyticsApi.getContentAnalytics(),
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 900);
  }, [queryClient]);

  /* ── derived data ──────────────────────────────────────────────── */
  const stats: DashboardOverview = toObj(dashData?.data ?? dashData) as DashboardOverview;
  const userGrowthData   = toArray(userGrowth?.data   ?? userGrowth);
  const jaapActivityData = toArray(jaapActivity?.data ?? jaapActivity);
  const deviceData       = toArray(deviceBreakdown?.data ?? deviceBreakdown);
  const contentData      = toObj(contentAnalytics?.data ?? contentAnalytics);

  const userChartData  = userGrowthData.map((d: any) => ({ x: d._id || '', y: Number(d.count) || 0 }));
  const deviceChartData = deviceData.map((d: any) => ({ x: d._id || 'Unknown', y: Number(d.count) || 0 }));
  const totalDevices   = deviceData.reduce((s: number, d: any) => s + (Number(d.count) || 0), 0);
  const userSparkline  = userGrowthData.slice(-14).map((d: any) => Number(d.count) || 0);
  const sessionSparkline = jaapActivityData.slice(-14).map((d: any) => Number(d.sessions) || 0);

  const totalSessions  = jaapActivityData.reduce((s: number, d: any) => s + (Number(d.sessions)   || 0), 0);
  const totalBeads     = jaapActivityData.reduce((s: number, d: any) => s + (Number(d.totalBeads)  || 0), 0);
  const totalNewUsers  = userGrowthData.reduce((s: number, d: any)   => s + (Number(d.count)       || 0), 0);

  const popularMantras: any[] = Array.isArray(stats?.popularMantras) ? stats.popularMantras : [];
  const maxMantraCount = popularMantras.reduce((m, pm) => Math.max(m, pm.count || 0), 1);

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ── KPI cards config ──────────────────────────────────────────── */
  const kpiCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats?.totalUsers ?? 0),
      sub: `${stats?.newUsersToday ?? 0} joined today`,
      icon: Users,
      from: '#f97316', to: '#f59e0b',
      bg: 'bg-orange-50', text: 'text-orange-600',
      border: 'border-orange-100/80', ring: 'ring-orange-200',
      sparkData: userSparkline, sparkColor: '#f97316',
      trend: 5,
    },
    {
      title: 'Active / Month',
      value: formatNumber(stats?.activeUsers?.month ?? 0),
      sub: `${formatNumber(stats?.activeUsers?.week ?? 0)} this week`,
      icon: UserCheck,
      from: '#3b82f6', to: '#06b6d4',
      bg: 'bg-blue-50', text: 'text-blue-600',
      border: 'border-blue-100/80', ring: 'ring-blue-200',
      sparkData: [], sparkColor: '#3b82f6',
      trend: 2,
    },
    {
      title: 'Active Today',
      value: formatNumber(stats?.activeUsers?.today ?? 0),
      sub: `${formatNumber(stats?.newUsersWeek ?? 0)} new this week`,
      icon: CircleDot,
      from: '#10b981', to: '#14b8a6',
      bg: 'bg-emerald-50', text: 'text-emerald-600',
      border: 'border-emerald-100/80', ring: 'ring-emerald-200',
      sparkData: [], sparkColor: '#10b981',
      trend: 0,
    },
    {
      title: 'Jaap Sessions',
      value: formatNumber(stats?.totalJaapSessions ?? 0),
      sub: `${formatNumber(stats?.jaapSessionsToday ?? 0)} today`,
      icon: Activity,
      from: '#8b5cf6', to: '#a855f7',
      bg: 'bg-violet-50', text: 'text-violet-600',
      border: 'border-violet-100/80', ring: 'ring-violet-200',
      sparkData: sessionSparkline, sparkColor: '#8b5cf6',
      trend: 8,
    },
    {
      title: 'Mantras',
      value: formatNumber(stats?.mantrasCount ?? 0),
      sub: `${formatNumber(stats?.notificationsSent ?? 0)} notifications`,
      icon: BookOpen,
      from: '#f43f5e', to: '#ec4899',
      bg: 'bg-rose-50', text: 'text-rose-600',
      border: 'border-rose-100/80', ring: 'ring-rose-200',
      sparkData: [], sparkColor: '#f43f5e',
      trend: -1,
    },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-7 pb-10">

      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#080c14] shadow-2xl">
        {/* animated gradient border */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.25) 0%, transparent 40%, rgba(139,92,246,0.18) 100%)', zIndex: 0 }}
        />
        {/* mesh gradients */}
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 85% -5%, rgba(249,115,22,0.22) 0%, transparent 65%),' +
            'radial-gradient(ellipse 55% 45% at 5% 105%, rgba(139,92,246,0.18) 0%, transparent 60%),' +
            'radial-gradient(ellipse 40% 35% at 55% 55%, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }} />
        {/* dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10 px-6 pt-7 pb-6">
          {/* TOP ROW */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: identity */}
            <div className="flex items-center gap-4">
              {/* glowing OM badge */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-orange-500 to-amber-400 blur-md opacity-50" />
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 via-amber-400 to-yellow-300 shadow-lg">
                  <span className="text-3xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'serif' }}>ॐ</span>
                </div>
                {/* live dot */}
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center">
                  <span className="absolute h-4 w-4 animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#080c14]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-500">{getGreeting()} 👋</p>
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-400">Admin</span>
                </div>
                <h1 className="text-[26px] font-black leading-tight tracking-tight text-white">
                  Digital Mandir
                </h1>
                <div className="mt-1 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-gray-600" />
                  <span className="text-[11px] text-gray-500">{dateStr}</span>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
              </div>
              <button
                onClick={handleRefresh}
                className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-gray-400 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 transition-colors ${isRefreshing ? 'animate-spin text-orange-400' : 'group-hover:text-orange-300'}`} />
                Refresh
              </button>
              <a
                href="/analytics"
                className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-orange-500 to-amber-400 px-4 py-1.5 text-[11px] font-black text-white shadow-xl shadow-orange-600/30 transition-all hover:brightness-110 hover:shadow-orange-500/50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Analytics
              </a>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="my-6 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

          {/* MINI STAT TILES */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'New Today',       value: stats?.newUsersToday     ?? 0, icon: UserPlus, color: 'text-orange-300', glow: 'rgba(249,115,22,0.15)', loading: loadingDash },
              { label: 'Sessions Today',  value: stats?.jaapSessionsToday ?? 0, icon: Flame,    color: 'text-violet-300', glow: 'rgba(139,92,246,0.15)', loading: loadingDash },
              { label: `Users (${userPeriod}d)`, value: totalNewUsers,           icon: TrendingUp, color: 'text-blue-300', glow: 'rgba(59,130,246,0.15)', loading: loadingUsers },
              { label: `Sessions (${jaapDays}d)`, value: totalSessions,          icon: Activity, color: 'text-emerald-300', glow: 'rgba(16,185,129,0.15)', loading: loadingJaap },
            ].map((s) => (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/4 px-4 py-3.5 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/7"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(circle at 80% 20%, ${s.glow} 0%, transparent 70%)` }} />
                <div className="relative flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</p>
                    <p className="mt-2 text-[22px] font-black leading-none text-white">
                      {s.loading
                        ? <span className="inline-block h-6 w-16 animate-pulse rounded-lg bg-white/10" />
                        : formatNumber(s.value)}
                    </p>
                  </div>
                  <div className="mt-0.5 rounded-xl border border-white/5 bg-white/5 p-2">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BEADS CALLOUT */}
          {!loadingJaap && totalBeads > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.07] px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                <Medal className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">{formatNumber(totalBeads)} beads chanted</p>
                <p className="text-[10px] text-gray-500">Across all users in the last {jaapDays} days</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-600">
                <Clock className="h-3 w-3" />
                {jaapDays}d window
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────── */}
      <div>
        <SectionLabel color="bg-orange-500">Overview</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {loadingDash
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((card) => (
              <div
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:ring-2 ${card.border} ${card.ring}`}
                style={{ background: `linear-gradient(150deg, #ffffff 0%, ${card.from}0e 100%)` }}
              >
                {/* top gradient strip */}
                <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${card.from}, ${card.to})` }} />

                {/* faded watermark */}
                <div className="pointer-events-none absolute -right-2 -top-1 opacity-[0.055] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.10]">
                  <card.icon className="h-20 w-20" style={{ color: card.from }} />
                </div>

                <div className="p-4">
                  {/* icon row */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${card.from}, ${card.to})`,
                        boxShadow: `0 6px 16px ${card.from}50`,
                      }}
                    >
                      <card.icon className="h-[18px] w-[18px] text-white" />
                    </div>
                    <Trend value={card.trend} />
                  </div>

                  {/* label */}
                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">{card.title}</p>

                  {/* value */}
                  <p
                    className="mt-0.5 text-[26px] font-black leading-none tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${card.from} 30%, ${card.to} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {card.value}
                  </p>

                  {/* sub + sparkline */}
                  <div className="mt-1.5 flex items-end justify-between gap-1">
                    <p className="text-[10px] font-medium text-gray-400 leading-tight">{card.sub}</p>
                    {card.sparkData.length >= 4 && (
                      <div className="shrink-0 opacity-50 transition-opacity group-hover:opacity-90">
                        <Sparkline data={card.sparkData} color={card.from} width={52} height={28} />
                      </div>
                    )}
                  </div>

                  {/* bottom glow bar */}
                  <div
                    className="mt-3 h-0.5 w-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${card.from}90, ${card.to}50, transparent)` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── CHARTS ROW 1: User Growth ────────────────────── */}
      <div>
        <SectionLabel color="bg-blue-500">User Growth</SectionLabel>
        <div className="grid gap-4">

          {/* User Growth */}
          <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/80 transition-all hover:-translate-y-1">
            {/* coloured top strip */}
            <div className="h-1 w-full bg-linear-to-r from-orange-500 to-amber-400" />
            <div className="border-b border-gray-50 bg-linear-to-br from-orange-50/60 to-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-300/40" style={{ width: 44, height: 44 }}>
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-gray-900">User Growth</CardTitle>
                    <p className="text-[10px] text-gray-400">New registrations over time</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setUserPeriod(p.days)}
                      className={`rounded-xl px-3 py-1.5 text-[10px] font-black transition-all ${
                        userPeriod === p.days
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-300/40'
                          : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <a href="/analytics" className="ml-1 flex items-center gap-1 rounded-xl bg-orange-50 px-2.5 py-1.5 text-[10px] font-black text-orange-600 hover:bg-orange-100">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              {!loadingUsers && totalNewUsers > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 text-[11px] font-black text-orange-600">
                    +{formatNumber(totalNewUsers)} in {userPeriod}d
                  </span>
                  {userGrowthData.length > 0 && (
                    <span className="text-[10px] text-gray-400">
                      avg {Math.round(totalNewUsers / userGrowthData.length)}/day
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="px-1 pb-3 pt-0">
              {loadingUsers ? <SkeletonChart height={280} /> : userChartData.length > 0 ? (
                <AreaChart data={userChartData} color="#ea580c" gradientId="dash-user-grad" height={280} />
              ) : (
                <div className="flex h-[280px] flex-col items-center justify-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                    <TrendingUp className="h-7 w-7 text-orange-200" />
                  </div>
                  <p className="text-sm font-semibold text-gray-300">No data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2: Jaap Activity + Popular Mantras ─────────── */}
      <div>
        <SectionLabel color="bg-indigo-500">Activity & Content</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Jaap Activity */}
          <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/80 transition-all hover:-translate-y-1 lg:col-span-2">
            <div className="h-1 w-full bg-linear-to-r from-indigo-500 to-blue-500" />
            <div className="border-b border-gray-50 bg-linear-to-br from-indigo-50/60 to-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-300/40" style={{ width: 44, height: 44 }}>
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-gray-900">Jaap Activity</CardTitle>
                    <p className="text-[10px] text-gray-400">Sessions &amp; beads per day</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setJaapDays(p.days)}
                      className={`rounded-xl px-3 py-1.5 text-[10px] font-black transition-all ${
                        jaapDays === p.days
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-300/40'
                          : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <a href="/analytics" className="ml-1 flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1.5 text-[10px] font-black text-indigo-600 hover:bg-indigo-100">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              {!loadingJaap && (totalSessions > 0 || totalBeads > 0) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-black text-indigo-600">{formatNumber(totalSessions)} sessions</span>
                  <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 text-[11px] font-black text-orange-600">{formatNumber(totalBeads)} beads</span>
                  {jaapActivityData.length > 0 && (
                    <span className="text-[10px] text-gray-400">avg {Math.round(totalSessions / jaapActivityData.length)}/day</span>
                  )}
                </div>
              )}
            </div>
            <div className="px-1 pb-3 pt-0">
              {loadingJaap ? <SkeletonChart height={280} /> : jaapActivityData.length > 0 ? (
                <BarChart
                  data={jaapActivityData}
                  xKey="_id"
                  series={[
                    { dataKey: 'sessions',   color: '#6366f1', label: 'Sessions' },
                    { dataKey: 'totalBeads', color: '#f97316', label: 'Beads' },
                  ]}
                  height={280}
                />
              ) : (
                <div className="flex h-[280px] flex-col items-center justify-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                    <Activity className="h-7 w-7 text-indigo-200" />
                  </div>
                  <p className="text-sm font-semibold text-gray-300">No data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Popular Mantras */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/80 transition-all hover:-translate-y-1">
            <div className="h-1 w-full bg-linear-to-r from-amber-400 to-orange-500" />
            <div className="border-b border-gray-50 bg-linear-to-br from-amber-50/60 to-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/40" style={{ width: 44, height: 44 }}>
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-gray-900">Top Mantras</CardTitle>
                    <p className="text-[10px] text-gray-400">Ranked by jaap count</p>
                  </div>
                </div>
                <a href="/content/mantras" className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-600 hover:bg-amber-100">
                  All <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            <div className="px-5 py-4">
              {loadingDash ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-gray-100" />
                        <div className="h-2.5 rounded-full bg-gray-100" style={{ width: `${68 - i * 8}%` }} />
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100" style={{ width: `${82 - i * 10}%` }} />
                    </div>
                  ))}
                </div>
              ) : popularMantras.length > 0 ? (
                <div className="space-y-4">
                  {popularMantras.slice(0, 7).map((m: any, i: number) => {
                    const pct = maxMantraCount > 0 ? Math.round(((m.count || 0) / maxMantraCount) * 100) : 0;
                    return (
                      <div key={m._id ?? i} className="group/item space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <RankBadge rank={i + 1} />
                            <span className="min-w-0 truncate text-xs font-bold text-gray-700 group-hover/item:text-gray-900">
                              {m._id ?? `Mantra #${i + 1}`}
                            </span>
                          </div>
                          <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-600">
                            {formatNumber(m.count ?? 0)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${BAR_COLORS[i % BAR_COLORS.length]}, ${BAR_COLORS[(i + 1) % BAR_COLORS.length]})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                    <Star className="h-7 w-7 text-amber-200" />
                  </div>
                  <p className="text-sm font-semibold text-gray-300">No data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel color="bg-emerald-500">Management</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Content Library */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:-translate-y-0.5">
            {/* top accent strip */}
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #eab308)' }} />
            {/* card header */}
            <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)' }}>
              <div
                className="flex shrink-0 items-center justify-center rounded-xl"
                style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #f59e0b, #eab308)', boxShadow: '0 4px 12px #f59e0b50' }}
              >
                <Layers className="h-[18px] w-[18px] text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold leading-tight text-gray-900">Content Library</p>
                <p className="text-[10px] leading-tight text-amber-500/80">All content at a glance</p>
              </div>
              <a href="/content/mantras" className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-black text-white hover:bg-amber-600 transition-colors">
                Manage <ChevronRight className="h-3 w-3" />
              </a>
            </div>
            <div className="divide-y divide-gray-50 px-3 pb-3 pt-1">
              {[
                { label: 'Mantras',          value: stats?.mantrasCount ?? 0,                  from: '#f97316', to: '#f59e0b', icon: BookOpen, href: '/content/mantras' },
                { label: 'Deities',          value: (contentData as any)?.deitiesCount ?? '—', from: '#8b5cf6', to: '#a855f7', icon: Star,    href: '/content/deities' },
                { label: 'Content Sections', value: (contentData as any)?.contentCount ?? '—', from: '#3b82f6', to: '#06b6d4', icon: Globe2,  href: '/content/sections' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all hover:bg-gray-50"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})`, boxShadow: `0 4px 10px ${item.from}40` }}
                  >
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                    <p
                      className="text-xl font-black leading-tight"
                      style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                    >
                      {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500" />
                </a>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:-translate-y-0.5">
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)' }} />
            <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)' }}>
              <div
                className="flex shrink-0 items-center justify-center rounded-xl"
                style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', boxShadow: '0 4px 12px #0ea5e950' }}
              >
                <ZapIcon className="h-[18px] w-[18px] text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold leading-tight text-gray-900">Engagement</p>
                <p className="text-[10px] leading-tight text-sky-500/80">Real-time activity metrics</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 px-3 pb-3 pt-1">
              {[
                { label: 'Sessions Today',  value: stats?.jaapSessionsToday  ?? 0, from: '#6366f1', to: '#8b5cf6', icon: Activity  },
                { label: 'New Users Today', value: stats?.newUsersToday      ?? 0, from: '#10b981', to: '#14b8a6', icon: UserPlus  },
                { label: 'Active (Week)',   value: stats?.activeUsers?.week  ?? 0, from: '#3b82f6', to: '#06b6d4', icon: UserCheck },
                { label: 'Notifications',  value: stats?.notificationsSent  ?? 0, from: '#f97316', to: '#f59e0b', icon: Bell      },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all hover:bg-gray-50"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})`, boxShadow: `0 4px 10px ${item.from}40` }}
                  >
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                    <p className="text-xl font-black leading-tight" style={{ color: item.from }}>
                      {loadingDash
                        ? <span className="inline-block h-5 w-12 animate-pulse rounded-lg bg-gray-200" />
                        : formatNumber(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:-translate-y-0.5">
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #374151, #111827)' }} />
            <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)' }}>
              <div
                className="flex shrink-0 items-center justify-center rounded-xl"
                style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #374151, #111827)', boxShadow: '0 4px 12px #37415140' }}
              >
                <ZapIcon className="h-[18px] w-[18px] text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold leading-tight text-gray-900">Quick Actions</p>
                <p className="text-[10px] leading-tight text-gray-400">Shortcuts to common tasks</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 px-3 pb-3 pt-1">
              {[
                { label: 'Manage Mantras',    href: '/content/mantras',  icon: BookOpen,  from: '#f97316', to: '#f59e0b' },
                { label: 'Manage Users',      href: '/users',            icon: Users,     from: '#3b82f6', to: '#06b6d4' },
                { label: 'Send Notification', href: '/notifications',    icon: Send,      from: '#0ea5e9', to: '#6366f1' },
                { label: 'Leaderboard',       href: '/leaderboard',      icon: Trophy,    from: '#8b5cf6', to: '#ec4899' },
                { label: 'Full Analytics',    href: '/analytics',        icon: BarChart2, from: '#10b981', to: '#14b8a6' },
                { label: 'Settings',          href: '/settings',         icon: Settings2, from: '#6b7280', to: '#374151' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-all hover:bg-gray-50"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${action.from}, ${action.to})`, boxShadow: `0 4px 10px ${action.from}40` }}
                  >
                    <action.icon className="h-[15px] w-[15px] text-white" />
                  </div>
                  <p className="flex-1 text-[12px] font-semibold text-gray-700 group-hover:text-gray-900">{action.label}</p>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

