'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { jaapApi } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';
import { formatNumber } from '@/lib/utils';
import type { LeaderboardEntry } from '@/lib/types';
import {
  Trophy,
  Medal,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  RotateCcw,
  Star,
  Crown,
  TrendingUp,
} from 'lucide-react';

// Map frontend filter values to backend timeFilter values
const periodToTimeFilter: Record<string, string | undefined> = {
  all: undefined,
  weekly: 'week',
  monthly: 'month',
};

function getInitials(entry: LeaderboardEntry): string {
  const first = entry.firstName?.[0] || '';
  const last = entry.lastName?.[0] || '';
  if (first || last) return (first + last).toUpperCase();
  if (entry.username) {
    // Strip email domain if present
    const base = entry.username.includes('@') ? entry.username.split('@')[0] : entry.username;
    return base.slice(0, 2).toUpperCase();
  }
  return 'U';
}

function getDisplayName(entry: LeaderboardEntry): string {
  const full = [entry.firstName, entry.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (entry.username) {
    // If username is an email address, show only the local part (before @)
    return entry.username.includes('@') ? entry.username.split('@')[0] : entry.username;
  }
  return 'Anonymous';
}

const podiumColors = [
  {
    rank: 1,
    gradient: 'from-amber-400 to-yellow-300',
    bgGlow: 'bg-linear-to-br from-yellow-50 to-amber-50',
    border: 'border-yellow-300',
    ring: 'ring-yellow-400',
    text: 'text-yellow-600',
    badge: 'bg-linear-to-r from-amber-400 to-yellow-400 text-white',
    avatar: 'from-yellow-400 to-amber-500',
    shadow: 'shadow-yellow-200',
    icon: Crown,
  },
  {
    rank: 2,
    gradient: 'from-slate-400 to-gray-300',
    bgGlow: 'bg-linear-to-br from-slate-50 to-gray-50',
    border: 'border-slate-300',
    ring: 'ring-slate-400',
    text: 'text-slate-500',
    badge: 'bg-linear-to-r from-slate-400 to-gray-400 text-white',
    avatar: 'from-slate-400 to-gray-500',
    shadow: 'shadow-slate-200',
    icon: Medal,
  },
  {
    rank: 3,
    gradient: 'from-orange-500 to-amber-700',
    bgGlow: 'bg-linear-to-br from-orange-50 to-amber-50',
    border: 'border-orange-300',
    ring: 'ring-orange-400',
    text: 'text-orange-700',
    badge: 'bg-linear-to-r from-orange-500 to-amber-600 text-white',
    avatar: 'from-orange-400 to-amber-600',
    shadow: 'shadow-orange-200',
    icon: Medal,
  },
];

// ─── Avatar Component ──────────────────────────────────────────────────────
function LeaderboardAvatar({
  entry,
  size = 'md',
  gradient,
}: {
  entry: LeaderboardEntry;
  size?: 'sm' | 'md';
  gradient: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-16 w-16 text-xl';
  const ringClass = size === 'sm' ? '' : 'ring-4 ring-white shadow-lg';
  
  // Determine if we should show the image
  const hasValidImage = entry.avatar && !imageFailed;
  const shouldShowImage = hasValidImage && imageLoaded;
  
  return (
    <div
      className={`relative inline-flex ${sizeClass} items-center justify-center rounded-full bg-linear-to-br ${gradient} font-semibold text-white overflow-hidden ${ringClass}`}
    >
      {hasValidImage && (
        <img
          key={entry.avatar}
          src={entry.avatar ?? undefined}
          alt={getDisplayName(entry)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageFailed(true);
            setImageLoaded(false);
          }}
          loading="lazy"
        />
      )}
      {!shouldShowImage && (
        <span className="flex items-center justify-center text-white">
          {getInitials(entry)}
        </span>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  index,
  config,
}: {
  entry: LeaderboardEntry;
  index: number;
  config: (typeof podiumColors)[0];
}) {
  const IconComp = config.icon;
  const heights = ['h-36', 'h-28', 'h-24'];
  const scales = ['scale-105', 'scale-100', 'scale-100'];

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border-2 ${config.border} ${config.bgGlow} p-6 shadow-xl ${config.shadow} ${scales[index]} transition-transform duration-300 hover:scale-105`}
    >
      {/* Rank badge */}
      <div
        className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold shadow-md ${config.badge}`}
      >
        #{config.rank}
      </div>

      {/* Icon */}
      <div className={`mb-3 mt-2 ${config.text}`}>
        <IconComp className="h-8 w-8" />
      </div>

      {/* Avatar */}
      <LeaderboardAvatar entry={entry} size="md" gradient={config.avatar} />

      {/* Name */}
      <h3 className="mt-3 text-center text-sm font-bold text-gray-900 leading-tight max-w-[120px]">
        {getDisplayName(entry)}
      </h3>

      {/* Beads */}
      <div className="mt-2 text-center">
        <p className={`text-2xl font-extrabold ${config.text}`}>
          {formatNumber(entry.totalBeads)}
        </p>
        <p className="text-xs text-gray-400 font-medium">beads</p>
      </div>

      {/* Stats */}
      <div className="mt-3 flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <RotateCcw className="h-3 w-3" />
          {formatNumber(entry.totalRounds)}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {formatNumber(entry.totalJaapSessions)}
        </span>
      </div>

      {/* Podium base */}
      <div
        className={`absolute bottom-0 left-0 right-0 rounded-b-2xl ${heights[index]} bg-linear-to-b ${config.gradient} opacity-10`}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('all');
  const [limitCount, setLimitCount] = useState(50);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period, limitCount, page],
    queryFn: () =>
      jaapApi.getLeaderboard({
        timeFilter: periodToTimeFilter[period],
        limit: limitCount,
        page,
      }),
  });

  // Parse API response
  const raw = data?.data as any;
  const items: LeaderboardEntry[] = (() => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.data?.items)) return raw.data.items;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  })();

  const meta = raw?.meta || raw?.data?.meta || null;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || items.length;

  // Client-side search filter
  const entries: LeaderboardEntry[] = search.trim()
    ? items.filter((e) => {
        const name = getDisplayName(e).toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q);
      })
    : items;

  const top3 = entries.slice(0, 3);
  // Reorder: 2nd, 1st, 3rd for podium display
  const podiumOrder =
    top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
        ? [top3[1], top3[0]]
        : top3;
  const podiumConfigs =
    top3.length >= 3
      ? [podiumColors[1], podiumColors[0], podiumColors[2]]
      : top3.length === 2
        ? [podiumColors[1], podiumColors[0]]
        : [podiumColors[0]];

  // Summary stats
  const totalBeadsSum = items.reduce((s, e) => s + (e.totalBeads || 0), 0);
  const totalRoundsSum = items.reduce((s, e) => s + (e.totalRounds || 0), 0);
  const totalSessionsSum = items.reduce((s, e) => s + (e.totalJaapSessions || 0), 0);

  return (
    <div className="space-y-8 pb-8">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-600 via-orange-500 to-amber-400 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Leaderboard</h1>
                <p className="mt-0.5 text-orange-100 text-sm">
                  Champion devotees ranked by total beads counted
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Period filter */}
            <div className="flex rounded-xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-sm">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'monthly', label: 'Month' },
                { value: 'weekly', label: 'Week' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriod(opt.value); setPage(1); }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    period === opt.value
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Limit filter */}
            <div className="flex rounded-xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-sm">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => { setLimitCount(n); setPage(1); }}
                  className={`px-3 py-2 text-sm font-medium transition-all ${
                    limitCount === n
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-32 h-36 w-36 rounded-full bg-amber-300/20 blur-2xl" />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <Trophy className="h-8 w-8 text-orange-300" />
          </div>
          <p className="text-lg font-semibold text-gray-400">No leaderboard data yet</p>
          <p className="mt-1 text-sm text-gray-400">Data will appear once users complete jaap sessions</p>
        </div>
      ) : (
        <>
          {/* ── Summary Stats ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Users,
                label: 'Total Champions',
                value: formatNumber(totalItems),
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                icon: TrendingUp,
                label: 'Total Beads (Shown)',
                value: formatNumber(totalBeadsSum),
                color: 'text-orange-600',
                bg: 'bg-orange-50',
              },
              {
                icon: RotateCcw,
                label: 'Total Rounds (Shown)',
                value: formatNumber(totalRoundsSum),
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm"
              >
                <div className={`rounded-xl p-3 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{s.label}</p>
                  <p className={`mt-0.5 text-xl font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Podium (Top 3) ── */}
          {top3.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Top Champions
              </h2>
              <div className="flex items-end justify-center gap-2 sm:gap-4">
                {podiumOrder.map((entry, idx) => (
                  <div
                    key={entry._id}
                    className={`flex-1 max-w-[180px] sm:max-w-[220px] ${idx === 1 ? '-mb-4' : ''}`}
                  >
                    <PodiumCard
                      entry={entry}
                      index={idx}
                      config={podiumConfigs[idx]}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Full Rankings Table ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Table Header */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Full Rankings</h2>
                <p className="text-xs text-gray-500 mt-0.5">{formatNumber(totalItems)} total participants</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-16">
                      Rank
                    </th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Devotee
                    </th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Total Beads
                    </th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Rounds
                    </th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Sessions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry, i) => {
                    const globalRank = (page - 1) * limitCount + i + 1;
                    const isTop = globalRank <= 3;
                    const rankStyle =
                      globalRank === 1
                        ? 'text-yellow-500'
                        : globalRank === 2
                          ? 'text-slate-400'
                          : globalRank === 3
                            ? 'text-orange-700'
                            : 'text-gray-400';
                    const rowBg =
                      globalRank === 1
                        ? 'bg-yellow-50/60'
                        : globalRank === 2
                          ? 'bg-slate-50/60'
                          : globalRank === 3
                            ? 'bg-orange-50/60'
                            : '';

                    return (
                      <tr
                        key={entry._id}
                        onClick={() => router.push(`/users/${entry._id}`)}
                        className={`group cursor-pointer transition-colors hover:bg-orange-50/40 ${rowBg}`}
                      >
                        {/* Rank */}
                        <td className="px-5 py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-extrabold text-[10px] ${
                                globalRank === 1
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : globalRank === 2
                                    ? 'bg-slate-100 text-slate-500'
                                    : globalRank === 3
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {globalRank}
                            </div>
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-5 py-2">
                          <div className="flex items-center gap-2.5">
                            <LeaderboardAvatar
                              entry={entry}
                              size="sm"
                              gradient={
                                globalRank === 1
                                  ? 'from-yellow-400 to-amber-500'
                                  : globalRank === 2
                                    ? 'from-slate-400 to-gray-500'
                                    : globalRank === 3
                                      ? 'from-orange-400 to-amber-600'
                                      : 'from-orange-400 to-red-500'
                              }
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {getDisplayName(entry)}
                              </p>

                            </div>
                          </div>
                        </td>

                        {/* Beads */}
                        <td className="px-5 py-2 text-right">
                          <span className="text-sm font-bold text-orange-600">
                            {formatNumber(entry.totalBeads)}
                          </span>
                        </td>

                        {/* Rounds */}
                        <td className="px-5 py-2 text-right">
                          <span className="text-sm text-gray-600">{formatNumber(entry.totalRounds)}</span>
                        </td>

                        {/* Sessions */}
                        <td className="px-5 py-2 text-right">
                          <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium text-orange-700">
                            {formatNumber(entry.totalJaapSessions)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 sm:flex-row items-center justify-between border-t border-gray-100 px-3 sm:px-5 py-3">
                <p className="text-sm text-gray-500">
                  Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                  <span className="ml-2 text-gray-400">· {formatNumber(totalItems)} total</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                            : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
