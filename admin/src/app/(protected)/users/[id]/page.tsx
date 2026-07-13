'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate, formatNumber, formatDuration } from '@/lib/utils';
import type { User, Device, Session, JaapSession, PaginatedResponse } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Smartphone, Key, Activity, MapPin,
  Sun, Moon, Bell, BellOff, Globe, User as UserIcon,
  Hash, RefreshCw, CheckCircle2, XCircle, Shield, Crown,
  Clock, Monitor, Wifi, Mail, Phone, Calendar, TrendingUp,
  Zap, Coins, Star, AlertTriangle, Cake, BookOpen, BadgeCheck, BadgeX,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
function getDisplayName(user: User): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  }
  return user.username ?? user.email ?? user.phone ?? 'Unknown';
}

function getInitials(user: User): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return '??';
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

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  festival: <Zap className="h-4 w-4 text-orange-500" />,
  god:      <Star className="h-4 w-4 text-violet-500" />,
  special:  <CheckCircle2 className="h-4 w-4 text-sky-500" />,
  custom:   <Activity className="h-4 w-4 text-gray-500" />,
};

const CATEGORY_COLORS: Record<string, { bg: string }> = {
  festival: { bg: 'bg-orange-100' },
  god:      { bg: 'bg-violet-100' },
  special:  { bg: 'bg-sky-100' },
  custom:   { bg: 'bg-gray-100' },
};

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, iconBg, valueCls,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  valueCls: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-black leading-none ${valueCls}`}>{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────
function InfoRow({
  icon, label, value, mono,
}: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <span className={`text-right text-sm font-semibold text-gray-800 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({
  title, icon, count, badge, children,
}: {
  title: string; icon: React.ReactNode; count?: number; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <h2 className="font-bold text-gray-800">{title}</h2>
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
            {count}
          </span>
        )}
        {badge && !count && badge}
        {count !== undefined && badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Role Management ────────────────────────────────────────────────────────
function RoleManagement({ user, userId }: { user: User; userId: string }) {
  const { user: currentAdmin, fetchUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'make_admin' | 'remove_admin' | 'make_super_admin' | null>(null);

  const isSuperAdmin = currentAdmin?.roles?.includes('super_admin') ?? false;
  const isAdmin = currentAdmin?.roles?.includes('admin') ?? false;
  const userIsAdmin = user.roles?.includes('admin');
  const userIsSuperAdmin = user.roles?.includes('super_admin');
  const isSelf = currentAdmin?._id === user._id;

  const roleMutation = useMutation({
    mutationFn: (newRoles: string[]) =>
      usersApi.update(userId, { roles: newRoles }),
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // If we promoted someone to super_admin, our own roles changed — refresh
      if (confirmAction === 'make_super_admin') {
        fetchUser();
      }
      setConfirmAction(null);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Failed to update role';
      toast.error(message);
      setConfirmAction(null);
    },
  });

  const handleRoleAction = () => {
    if (!confirmAction) return;
    switch (confirmAction) {
      case 'make_admin':
        roleMutation.mutate([...new Set([...(user.roles || []), 'admin'])]);
        break;
      case 'remove_admin':
        roleMutation.mutate((user.roles || []).filter(r => r !== 'admin' && r !== 'super_admin'));
        break;
      case 'make_super_admin':
        roleMutation.mutate([...new Set([...(user.roles || []), 'admin', 'super_admin'])]);
        break;
    }
  };

  if (!isAdmin && !isSuperAdmin) return null;

  return (
    <>
      <Section title="Role Management" icon={<Shield className="h-4 w-4" />}>
        <div className="space-y-4">
          {/* Current Roles */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Current Roles:</span>
            {user.roles.map(r => (
              <span
                key={r}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase
                  ${r === 'super_admin' ? 'bg-purple-100 text-purple-700' : r === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}
              >
                {r === 'super_admin' && <Crown className="h-3 w-3" />}
                {r === 'admin' && <Shield className="h-3 w-3" />}
                {r === 'super_admin' ? 'Super Admin' : r}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Make Admin button */}
            {!userIsAdmin && !isSelf && (
              <button
                onClick={() => setConfirmAction('make_admin')}
                disabled={roleMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />
                Make Admin
              </button>
            )}

            {/* Remove Admin button */}
            {userIsAdmin && !userIsSuperAdmin && !isSelf && (
              <button
                onClick={() => setConfirmAction('remove_admin')}
                disabled={roleMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Remove Admin
              </button>
            )}

            {/* Make Super Admin button - only visible to super admin */}
            {isSuperAdmin && !userIsSuperAdmin && !isSelf && (
              <button
                onClick={() => setConfirmAction('make_super_admin')}
                disabled={roleMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <Crown className="h-4 w-4" />
                Make Super Admin
              </button>
            )}

            {isSelf && (
              <p className="text-xs text-gray-400 italic">You cannot change your own role</p>
            )}
          </div>

          {/* Info note */}
          {isSuperAdmin && (
            <div className="flex items-start gap-2 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700">
                As Super Admin, you can create admins and promote users to Super Admin. Note: promoting a user to Super Admin will transfer your Super Admin role to them, and you will be demoted to Admin.
              </p>
            </div>
          )}

          {!isSuperAdmin && isAdmin && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <Shield className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                As Admin, you can make other users admins or remove their admin access. Only a Super Admin can promote users to Super Admin.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConfirmAction(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${confirmAction === 'make_super_admin' ? 'bg-purple-100' : confirmAction === 'remove_admin' ? 'bg-red-100' : 'bg-amber-100'}`}>
                {confirmAction === 'make_super_admin'
                  ? <Crown className="h-6 w-6 text-purple-600" />
                  : confirmAction === 'remove_admin'
                    ? <XCircle className="h-6 w-6 text-red-600" />
                    : <Shield className="h-6 w-6 text-amber-600" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmAction === 'make_admin' && 'Make Admin'}
                  {confirmAction === 'remove_admin' && 'Remove Admin'}
                  {confirmAction === 'make_super_admin' && 'Make Super Admin'}
                </h3>
                <p className="text-sm text-gray-500">This action requires confirmation</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-gray-50 border border-gray-100 p-4">
              {confirmAction === 'make_admin' && (
                <p className="text-sm text-gray-700">
                  Are you sure you want to make <strong>{user.firstName || user.email}</strong> an admin?
                  They will have access to the admin panel and manage content.
                </p>
              )}
              {confirmAction === 'remove_admin' && (
                <p className="text-sm text-gray-700">
                  Are you sure you want to remove admin access from <strong>{user.firstName || user.email}</strong>?
                  They will lose access to the admin panel.
                </p>
              )}
              {confirmAction === 'make_super_admin' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to make <strong>{user.firstName || user.email}</strong> the Super Admin?
                  </p>
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">
                      Warning: You will be demoted from Super Admin to Admin. This action cannot be undone by you.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleAction}
                disabled={roleMutation.isPending}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50
                  ${confirmAction === 'remove_admin' ? 'bg-red-600 hover:bg-red-700' : confirmAction === 'make_super_admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {roleMutation.isPending ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery<{ data: User }>({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });

  const { data: devicesData } = useQuery<{ data: PaginatedResponse<Device> }>({
    queryKey: ['user-devices', id],
    queryFn: () => usersApi.getDevices(id),
    enabled: !!id,
  });

  const { data: sessionsData } = useQuery<{ data: PaginatedResponse<Session> }>({
    queryKey: ['user-sessions', id],
    queryFn: () => usersApi.getSessions(id),
    enabled: !!id,
  });

  const { data: jaapData } = useQuery<{ data: { items: JaapSession[] } }>({
    queryKey: ['user-jaap', id],
    queryFn: () => usersApi.getJaapHistory(id, { limit: 50 }),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;

  const user = userData?.data;
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50">
        <UserIcon className="h-10 w-10 text-gray-200" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900">User not found</h3>
        <p className="mt-1 text-sm text-gray-500">This user may have been removed.</p>
      </div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Go Back
      </button>
    </div>
  );

  const devices: Device[] = devicesData?.data?.items ?? [];
  const sessions: Session[] = sessionsData?.data?.items ?? [];
  const jaapHistory: JaapSession[] = jaapData?.data?.items ?? [];
  const name = getDisplayName(user);
  const initials = getInitials(user);
  const grad = avatarColor(user._id);
  const now = new Date();
  const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now).length;
  const avgBeadsPerSession = jaapHistory.length > 0
    ? Math.round(jaapHistory.reduce((s, j) => s + j.totalBeads, 0) / jaapHistory.length)
    : 0;

  return (
    <div className="space-y-4">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 via-blue-900 to-indigo-900 p-5 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />

        {/* Top bar */}
        <div className="relative mb-5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
          </button>

        </div>

        {/* Profile */}
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className={`flex items-center justify-center rounded-2xl bg-linear-to-br ${grad} overflow-hidden shadow-lg ring-2 ring-white/20`}
              style={{ width: 72, height: 72 }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{initials}</span>
              )}
            </div>
            <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white shadow ${user.isActive ? 'bg-emerald-400' : 'bg-gray-400'}`}>
              {user.isActive
                ? <CheckCircle2 className="h-3 w-3 text-white" />
                : <XCircle className="h-3 w-3 text-white" />}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black tracking-tight">{name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${user.isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-gray-500/30 text-gray-300'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              {user.roles.includes('super_admin') && (
                <span className="flex items-center gap-1 rounded-full bg-purple-400/20 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-300">
                  <Crown className="h-2.5 w-2.5" /> Super Admin
                </span>
              )}
              {user.roles.includes('admin') && !user.roles.includes('super_admin') && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                  <Shield className="h-2.5 w-2.5" /> Admin
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {user.username && <p className="text-xs text-blue-200/70 font-mono">@{user.username}</p>}
              {user.email && (
                <p className="flex items-center gap-1.5 text-xs text-white/60">
                  <Mail className="h-3 w-3 shrink-0" />{user.email}
                </p>
              )}
              {user.phone && (
                <p className="flex items-center gap-1.5 text-xs text-white/50 font-mono">
                  <Phone className="h-3 w-3 shrink-0" />{user.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="relative mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Calendar className="h-3.5 w-3.5" />
            Joined {formatDate(user.createdAt)}
          </div>
          {user.lastLoginAt && (
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Zap className="h-3.5 w-3.5" />
              Last active {formatDate(user.lastLoginAt)}
            </div>
          )}
          {activeSessions > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeSessions} active session{activeSessions > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Hash className="h-5 w-5 text-indigo-600" />}
          value={formatNumber(user.totalBeads)}
          label="Total Beads"
          iconBg="bg-indigo-50"
          valueCls="text-indigo-700"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5 text-blue-600" />}
          value={formatNumber(user.totalRounds)}
          label="Total Rounds"
          iconBg="bg-blue-50"
          valueCls="text-blue-700"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-violet-600" />}
          value={formatNumber(user.totalJaapSessions)}
          label="Total Sessions"
          iconBg="bg-violet-50"
          valueCls="text-violet-700"
        />
        <StatCard
          icon={<Coins className="h-5 w-5 text-amber-600" />}
          value={formatNumber(user.totalCoins)}
          label="Total Coins"
          iconBg="bg-amber-50"
          valueCls="text-amber-700"
        />
      </div>

      {/* ── Role Management ────────────────────────────────────────────── */}
      <RoleManagement user={user} userId={id} />

      {/* Profile Info */}
        <Section title="Profile Info" icon={<UserIcon className="h-4 w-4" />}>
          <div className="space-y-0.5">
            {(user.firstName || user.lastName) && (
              <InfoRow icon={<UserIcon className="h-3 w-3" />} label="Name" value={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()} />
            )}
            <InfoRow icon={<Mail className="h-3 w-3" />}     label="Email"      value={user.email || '—'} />
            <InfoRow icon={<span className="text-[10px] font-bold">@</span>} label="Username" value={user.username ? `@${user.username}` : '—'} />
            <InfoRow icon={<UserIcon className="h-3 w-3" />} label="Gender"     value={user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—'} />
            {user.dateOfBirth && (
              <InfoRow icon={<Cake className="h-3 w-3" />} label="Date of Birth" value={formatDate(user.dateOfBirth)} />
            )}
            {user.bio && (
              <InfoRow icon={<BookOpen className="h-3 w-3" />} label="Bio" value={user.bio} />
            )}
            <InfoRow icon={<Calendar className="h-3 w-3" />} label="Joined"     value={formatDate(user.createdAt)} />
            <InfoRow icon={<Zap className="h-3 w-3" />}      label="Last Login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'} />
            <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {user.isActive ? <BadgeCheck className="h-3 w-3" /> : <BadgeX className="h-3 w-3" />}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Roles */}
            <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Shield className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Roles</span>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {user.roles.map(r => (
                  <span key={r} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${r === 'super_admin' ? 'bg-purple-100 text-purple-700' : r === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                    {r === 'super_admin' && <Crown className="h-2.5 w-2.5" />}
                    {r === 'admin' && <Shield className="h-2.5 w-2.5" />}
                    {r === 'super_admin' ? 'Super Admin' : r}
                  </span>
                ))}
              </div>
            </div>

            <div className="my-2 h-px bg-gray-100" />

            {/* Preferences */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-gray-600">Language</span>
              </div>
              <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                {user.preferences?.language ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                {user.preferences?.theme === 'dark'
                  ? <Moon className="h-4 w-4 text-indigo-500" />
                  : <Sun className="h-4 w-4 text-amber-500" />}
                <span className="text-xs font-semibold text-gray-600">Theme</span>
              </div>
              <span className="rounded-lg bg-gray-200 px-2 py-0.5 text-[10px] font-bold capitalize text-gray-700">
                {user.preferences?.theme ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                {user.preferences?.notifications
                  ? <Bell className="h-4 w-4 text-emerald-500" />
                  : <BellOff className="h-4 w-4 text-gray-400" />}
                <span className="text-xs font-semibold text-gray-600">Notifications</span>
              </div>
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${user.preferences?.notifications ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                {user.preferences?.notifications ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </Section>

      {/* ── Devices ───────────────────────────────────────────────────── */}
      <Section title="Registered Devices" icon={<Smartphone className="h-4 w-4" />} count={devices.length}>
        {devices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Smartphone className="h-7 w-7 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">No devices registered</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {devices.map((d) => (
              <div key={d._id} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${d.platform === 'ios' ? 'bg-linear-to-br from-gray-700 to-gray-900' : 'bg-linear-to-br from-emerald-500 to-teal-500'}`}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="font-bold text-sm text-gray-800 truncate">{d.deviceModel || d.deviceId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${d.platform === 'ios' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {d.platform}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    {d.appVersion && (
                      <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> v{d.appVersion}</span>
                    )}
                    {d.osVersion && <span className="text-gray-400">{d.osVersion}</span>}
                    {(d.approxLocation?.city || d.ip) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {d.approxLocation?.city
                          ? `${d.approxLocation.city}${d.approxLocation.country ? ', ' + d.approxLocation.country : ''}`
                          : d.ip}
                      </span>
                    )}
                    {d.lastActiveAt && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(d.lastActiveAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Auth Sessions ──────────────────────────────────────────────── */}
      <Section
        title="Auth Sessions"
        icon={<Key className="h-4 w-4" />}
        count={sessions.length}
        badge={
          activeSessions > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeSessions} active
            </span>
          ) : undefined
        }
      >
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Key className="h-7 w-7 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">No sessions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const expired = new Date(s.expiresAt) < now;
              return (
                <div key={s._id} className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs transition-all ${expired ? 'border-gray-100 bg-gray-50/40 opacity-50' : 'border-blue-100 bg-blue-50/30 hover:border-blue-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${expired ? 'bg-gray-100' : 'bg-blue-100'}`}>
                      <Wifi className={`h-3.5 w-3.5 ${expired ? 'text-gray-400' : 'text-blue-500'}`} />
                    </div>
                    <span className="font-mono font-semibold text-gray-700">{s.ip || '—'}</span>
                  </div>
                  <span className="flex-1 min-w-0 truncate text-gray-400">{s.userAgent || '—'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400">{formatDate(s.createdAt)}</span>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${expired ? 'bg-red-50 text-red-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      {expired ? <XCircle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                      {expired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Recent Jaap Sessions ───────────────────────────────────────── */}
      <Section
        title="Recent Jaap Sessions"
        icon={<Activity className="h-4 w-4" />}
        count={jaapHistory.length}
        badge={
          jaapHistory.length > 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <TrendingUp className="h-3.5 w-3.5" />
              avg {formatNumber(avgBeadsPerSession)} beads
            </span>
          ) : undefined
        }
      >
        {jaapHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Activity className="h-7 w-7 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">No jaap sessions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jaapHistory.map((j) => {
              const cat = j.category ?? 'custom';
              const catColors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.custom;
              const catIcon   = CATEGORY_ICON[cat]   ?? CATEGORY_ICON.custom;
              return (
                <div key={j._id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:border-indigo-100 hover:bg-indigo-50/20 hover:shadow-sm transition-all">
                  {/* Category */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${catColors.bg}`}>
                    {catIcon}
                  </div>
                  {/* Stats */}
                  <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 text-xs">
                    <span className="font-black text-gray-900">{formatNumber(j.totalBeads)}</span>
                    <span className="text-gray-400">beads</span>
                    <span className="text-gray-300">&middot;</span>
                    <span className="font-semibold text-gray-700">{j.rounds} round{j.rounds !== 1 ? 's' : ''}</span>
                    {j.duration > 0 && (
                      <>
                        <span className="text-gray-300">&middot;</span>
                        <span className="flex items-center gap-0.5 text-gray-400">
                          <Clock className="h-3 w-3" />{formatDuration(j.duration)}
                        </span>
                      </>
                    )}
                    {j.coinsEarned > 0 && (
                      <span className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 font-bold text-amber-600 border border-amber-100">
                        <Coins className="h-3 w-3" /> +{j.coinsEarned}
                      </span>
                    )}
                  </div>
                  {/* Date */}
                  <span className="shrink-0 text-[10px] text-gray-400 whitespace-nowrap">{formatDate(j.completedAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
