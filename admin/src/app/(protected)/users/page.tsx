'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatNumber } from '@/lib/utils';
import type { User, PaginatedResponse } from '@/lib/types';
import Link from 'next/link';
import {
  Search, Eye, X, Users, CheckCircle2, XCircle,
  LayoutGrid, List, Shield, TrendingUp, Hash,
  ArrowRight, Calendar, Phone, Mail, Crown, Smartphone,
} from 'lucide-react';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getAvatar(user: User): string {
  if (user.firstName || user.lastName) {
    return `${(user.firstName?.[0] ?? '')}${(user.lastName?.[0] ?? '')}`.toUpperCase();
  }
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return '??';
}

function getDisplayName(user: User): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  }
  return user.username ?? user.email ?? user.phone ?? 'Unknown';
}

const AVATAR_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-teal-500 to-emerald-500',
  'from-sky-500 to-blue-500',
  'from-amber-500 to-yellow-500',
];
const avatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

// â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({
  label, value, icon, sub, active, onClick,
}: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 flex-col gap-0.5 overflow-hidden rounded-xl px-3 py-2.5 text-left transition-all duration-200
        ${active ? 'bg-white/30 ring-2 ring-white/70 shadow-inner' : 'bg-white/15 hover:bg-white/25'}`}
    >
      <div className={`mb-0.5 flex h-5 w-5 items-center justify-center rounded-lg ${active ? 'bg-white/30' : 'bg-white/20'}`}>
        {icon}
      </div>
      <div className="text-xl font-black leading-none tracking-tight text-white">{value}</div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/75">{label}</p>
      {active && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white/70 shadow" />}
    </button>
  );
}

// â”€â”€ User Card (Grid) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UserCard({ user }: { user: User }) {
  const initials = getAvatar(user);
  const name = getDisplayName(user);
  const grad = avatarColor(user._id);

  return (
    <Link
      href={`/users/${user._id}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        ${user.isActive ? 'border-gray-100 hover:border-blue-200' : 'border-dashed border-gray-200 opacity-70 hover:opacity-85'}`}
    >
      {/* Top accent */}
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${user.isActive ? 'from-blue-500 via-indigo-400 to-violet-400' : 'from-gray-300 to-gray-200'}`} />

      {/* Banner + avatar */}
      <div className={`relative h-14 bg-linear-to-br ${grad} opacity-15`} />
      <div className="absolute left-3 top-7 overflow-hidden rounded-xl shadow-md ring-2 ring-white h-10 w-10">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // On image load error, fall back to initials
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add(`bg-gradient-to-br`, ...grad.split(' '));
                parent.innerHTML = `<span class="flex h-full w-full items-center justify-center text-sm font-black text-white">${initials}</span>`;
              }
            }}
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad}`}>
            <span className="text-sm font-black text-white">{initials}</span>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="absolute right-3 top-3">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase backdrop-blur-sm
          ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`h-1 w-1 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="px-3 pb-3 pt-7">
        {/* Name + contact */}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-gray-900 tracking-tight">{name}</h3>
          {user.email && (
            <div className="mt-0.5 flex items-center gap-1">
              <Mail className="h-2.5 w-2.5 shrink-0 text-gray-300" />
              <p className="truncate text-[11px] text-gray-400">{user.email}</p>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="h-2.5 w-2.5 shrink-0 text-gray-300" />
              <p className="text-[11px] text-gray-400 font-mono">{user.phone}</p>
            </div>
          )}
          {user.deviceModel && (
            <div className="flex items-center gap-1 mt-0.5">
              <Smartphone className="h-2.5 w-2.5 shrink-0 text-gray-300" />
              <p className="text-[10px] text-gray-400 truncate">{user.deviceModel}</p>
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {user.roles.map(r => (
            <span key={r} className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide
              ${r === 'super_admin' ? 'bg-purple-100 text-purple-700' : r === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
              {r === 'super_admin' && <Crown className="h-2 w-2" />}
              {r === 'admin' && <Shield className="h-2 w-2" />}
              {r}
            </span>
          ))}
        </div>

        {/* Stats grid */}
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-gray-50 p-2">
          <div className="text-center">
            <p className="text-xs font-black text-gray-900">{formatNumber(user.totalBeads)}</p>
            <p className="text-[8px] uppercase tracking-wide text-gray-400 font-medium">Beads</p>
          </div>
          <div className="border-x border-gray-200 text-center">
            <p className="text-xs font-black text-gray-900">{formatNumber(user.totalRounds)}</p>
            <p className="text-[8px] uppercase tracking-wide text-gray-400 font-medium">Rounds</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-orange-500">{formatNumber(user.totalCoins)}</p>
            <p className="text-[8px] uppercase tracking-wide text-gray-400 font-medium">Coins</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] text-gray-400">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(user.createdAt)}
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-500 transition-opacity">
            View <ArrowRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const limit = 15;

  const { data, isLoading } = useQuery<{ data: PaginatedResponse<User> }>({
    queryKey: ['users', page, search, role, statusFilter],
    queryFn: () =>
      usersApi.getAll({
        page,
        limit,
        search: search || undefined,
        role: role || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const users: User[] = data?.data?.items ?? [];
  const totalItems = (data?.data as any)?.meta?.totalItems ?? (data?.data as any)?.totalItems ?? 0;
  const totalPages = (data?.data as any)?.meta?.totalPages ?? (data?.data as any)?.totalPages ?? 1;
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="space-y-6">

      {/* â”€â”€ Hero Header â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 p-4 text-white shadow-lg shadow-blue-200">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-6 right-36 h-20 w-20 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute top-6 right-20 h-10 w-10 rounded-full bg-white/10" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm ring-1 ring-white/30">
              <Users className="h-4.5 w-4.5 text-white drop-shadow" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight drop-shadow-sm">User Management</h1>
              <p className="text-xs text-blue-100/80">
                <span className="font-bold text-white">{formatNumber(totalItems)}</span> registered users · real-time data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Data
            </div>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-2 sm:grid-cols-3">
          <StatCard
            label="Total Users"
            value={formatNumber(totalItems)}
            icon={<Users className="h-3.5 w-3.5 text-white" />}
            sub="All registered"
            active={statusFilter === 'all'}
            onClick={() => { setStatusFilter('all'); setPage(1); }}
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            sub="This page"
            active={statusFilter === 'active'}
            onClick={() => { setStatusFilter('active'); setPage(1); }}
          />
          <StatCard
            label="Inactive"
            value={inactiveCount}
            icon={<XCircle className="h-3.5 w-3.5 text-white" />}
            sub="This page"
            active={statusFilter === 'inactive'}
            onClick={() => { setStatusFilter('inactive'); setPage(1); }}
          />
        </div>
      </div>

      {/* â”€â”€ Toolbar â”€â”€ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-xs shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {(search || role || statusFilter !== 'all') && (
            <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-100">
              {users.length} result{users.length !== 1 ? 's' : ''}
            </span>
          )}

          {(search || role || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setRole(''); setStatusFilter('all'); setPage(1); }}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 shadow-sm transition-colors"
              title="Clear filters"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 transition-all duration-150 ${viewMode === 'list' ? 'bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-xl p-2 transition-all duration-150 ${viewMode === 'grid' ? 'bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
            <Users className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
          </div>
          <p className="text-sm text-gray-400 animate-pulse">Loading users…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-100 bg-linear-to-b from-blue-50/50 to-white py-28 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-blue-100 to-indigo-50 shadow-inner">
            <Users className="h-10 w-10 text-blue-300" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-gray-900">No users found</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500 leading-relaxed">Try adjusting your search or filters.</p>
          {(search || role || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setRole(''); setStatusFilter('all'); setPage(1); }}
              className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map(u => <UserCard key={u._id} user={u} />)}
        </div>
      ) : (
        /* â”€â”€ List View â”€â”€ */
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm mt-4">
          <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-[20px_minmax(0,3.5fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_60px] sm:grid-cols-[30px_minmax(0,3fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_80px] items-center gap-2 sm:gap-3 border-b border-gray-100 bg-gray-50/50 px-3 sm:px-5 py-3.5 text-[10px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span>#</span>
              <span>User</span>
              <span>Role</span>
              <span>Jaap Stats</span>
              <span>Status</span>
              <span>Joined</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-gray-50">
              {users.map((user, idx) => {
                const name = getDisplayName(user);
                const initials = getAvatar(user);
                const grad = avatarColor(user._id);
                return (
                  <div
                    key={user._id}
                    className={`group grid grid-cols-[20px_minmax(0,3.5fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_60px] sm:grid-cols-[30px_minmax(0,3fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_80px] items-center gap-2 sm:gap-3 px-3 sm:px-5 py-4 transition-colors duration-200 hover:bg-gray-50/80
                      ${!user.isActive ? 'opacity-60' : ''}`}
                  >
                    {/* Row number */}
                    <span className="text-[11px] font-bold text-gray-400 tabular-nums text-right">
                    {(page - 1) * limit + idx + 1}
                    </span>
                    {/* User cell */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full group/user cursor-pointer relative">
                    <div className={`relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg shadow-sm overflow-hidden ${!user.avatar ? `bg-gradient-to-br ${grad}` : 'bg-gray-100'}`}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.className = parent.className.replace('bg-gray-100', `bg-gradient-to-br ${grad}`);
                              parent.innerHTML = `<span class="flex h-full w-full items-center justify-center text-xs font-black text-white">${initials}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-black text-white">{initials}</span>
                      )}
                      {user.isActive && (
                        <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 ring-1 ring-white z-10" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-[12px] font-bold text-gray-900 break-words leading-tight">{name}</p>
                      <div className="flex flex-col mt-0.5 space-y-0.5">
                        {user.email && <p className="text-[9px] sm:text-[10px] font-medium text-gray-500 break-all leading-tight">{user.email}</p>}
                        {user.phone && <p className="text-[9px] sm:text-[10px] text-gray-400 font-mono break-all leading-tight">{user.phone}</p>}
                        {user.deviceModel && (
                          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-gray-400 mt-0.5">
                            <Smartphone className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" />
                            <span className="break-words line-clamp-2 leading-tight">{user.deviceModel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Role */}
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map(r => (
                      <span key={r} className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider
                        ${r === 'super_admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50' : r === 'admin' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50' : 'bg-blue-50/50 text-blue-600 ring-1 ring-blue-200/50'}`}>
                        {r === 'super_admin' && <Crown className="h-3 w-3" />}
                        {r === 'admin' && <Shield className="h-3 w-3" />}
                        {r}
                      </span>
                    ))}
                  </div>
                  {/* Stats */}
                  <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px]">
                    <span className="inline-flex w-fit items-center gap-1 sm:gap-1.5 rounded-lg bg-indigo-50/50 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-indigo-700 ring-1 ring-indigo-200/50">
                      <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{formatNumber(user.totalBeads)}
                    </span>
                    <span className="inline-flex w-fit items-center gap-1 sm:gap-1.5 rounded-lg bg-amber-50/50 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-amber-700 ring-1 ring-amber-200/50">
                      🪙 {formatNumber(user.totalCoins)}
                    </span>
                  </div>
                  {/* Status */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold
                      ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200/50'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {/* Joined */}
                  <div className="block text-[11px] font-medium text-gray-400">{formatDate(user.createdAt)}</div>
                  {/* Action */}
                  <div className="flex w-full justify-end">
                    <Link
                      href={`/users/${user._id}`}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
          <div className="flex items-center justify-center gap-2 w-full">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
            <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium whitespace-nowrap">
              <TrendingUp className="h-3.5 w-3.5" />
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} of {formatNumber(totalItems)} users
              {totalPages > 1 && <span className="text-gray-300 ml-1">· Page {page} of {totalPages}</span>}
            </span>
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          </div>
        </div>
      )}

      {!isLoading && users.length > 0 && totalPages <= 1 && (
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            {users.length} of {totalItems} users
          </span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}
    </div>
  );
}
