'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mantrasApi, deitiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';
import { formatNumber } from '@/lib/utils';
import type { Mantra, Deity } from '@/lib/types';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Plus, Pencil, Trash2, Search, Sparkles, BookOpen,
  Hash, LayoutGrid, List,
  Eye, EyeOff, X, AlertTriangle, CheckCircle2,
  Layers, Music2, Copy, Wifi, Globe, ArrowUpDown,
  ChevronDown, Star, Zap,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  festival: { label: 'Festival', color: 'text-orange-700', bg: 'bg-orange-100/80', icon: '🪔' },
  god:      { label: 'Deity',    color: 'text-violet-700', bg: 'bg-violet-100/80',  icon: '🙏' },
  special:  { label: 'Special',  color: 'text-amber-700',  bg: 'bg-amber-100/80',   icon: '✨' },
  custom:   { label: 'Custom',   color: 'text-teal-700',   bg: 'bg-teal-100/80',    icon: '🎯' },
};

const FILTER_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'god',      label: 'Deity Mantras' },
  { value: 'festival', label: 'Festival' },
  { value: 'special',  label: 'Special' },
  { value: 'custom',   label: 'Custom' },
];

const CARD_GRADIENTS = [
  'from-violet-400/20 via-purple-300/10 to-indigo-100/5',
  'from-orange-400/20 via-amber-300/10 to-yellow-100/5',
  'from-rose-400/20 via-pink-300/10 to-fuchsia-100/5',
  'from-teal-400/20 via-emerald-300/10 to-green-100/5',
  'from-sky-400/20 via-blue-300/10 to-cyan-100/5',
  'from-amber-400/20 via-orange-300/10 to-red-100/5',
];

const emptyI18n = { en: '', hi: '', sa: '' };

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'grid' | 'list';

function newMantraForm() {
  return {
    category: 'god' as string,
    deityId: '',
    title: { ...emptyI18n },
    text: { ...emptyI18n },
    description: { ...emptyI18n },
    imageUrl: '',
    audioUrl: '',
    beadCount: 108,
    coinsReward: 15,
    isActive: true,
    sortOrder: 0,
  };
}

// ── Section Label ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-4 w-1 rounded-full bg-linear-to-b from-violet-500 to-purple-400" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{children}</p>
    </div>
  );
}

// ── Category Pill ─────────────────────────────────────────────
function CategoryPill({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? { label: category, color: 'text-gray-700', bg: 'bg-gray-100', icon: '📿' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.bg} ${meta.color}`}>
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────
function DeleteConfirmDialog({
  mantra, onConfirm, onCancel, isLoading,
}: {
  mantra: Mantra | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!mantra) return null;
  return (
    <Modal isOpen={!!mantra} onClose={onCancel} title="" className="max-w-sm">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-red-100 to-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Delete Mantra</h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-800">&ldquo;{mantra.title.en}&rdquo;</span> will be
            permanently removed from the app.
          </p>
        </div>
        <div className="flex w-full gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} isLoading={isLoading}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Mantra Card (Grid) ────────────────────────────────────────
function MantraCard({
  mantra, index, onEdit, onToggle, onDelete, onDuplicate, isToggling,
}: {
  mantra: Mantra;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isToggling: boolean;
}) {
  const gradClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const deityName = typeof mantra.deityId === 'object' && mantra.deityId
    ? (mantra.deityId as Deity).name?.en
    : null;
  const deityHi = typeof mantra.deityId === 'object' && mantra.deityId
    ? (mantra.deityId as Deity).name?.hi
    : null;
  const meta = CATEGORY_META[mantra.category] ?? { label: mantra.category, color: 'text-gray-700', bg: 'bg-gray-100', icon: '📿' };

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        ${mantra.isActive
          ? 'border-gray-100 hover:border-violet-200'
          : 'border-dashed border-gray-200 opacity-60 hover:opacity-85'
        }`}
    >
      {/* Top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${mantra.isActive ? 'from-violet-500 via-purple-400 to-indigo-400' : 'from-gray-200 to-gray-300'}`} />

      {/* Image / Banner section */}
      <div className={`relative flex h-36 items-center justify-center overflow-hidden bg-linear-to-br ${gradClass}`}>
        {/* Decorative circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-28 w-28 rounded-full bg-white/30 blur-3xl" />
        </div>
        {/* Sanskrit OM watermark */}
        <span className="pointer-events-none absolute right-3 bottom-2 select-none text-5xl font-bold text-white/8 leading-none">ॐ</span>

        {mantra.imageUrl ? (
          <img
            src={mantra.imageUrl}
            alt={mantra.title.en}
            className="relative z-10 h-24 w-24 rounded-2xl object-contain drop-shadow-lg ring-2 ring-white/40 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm border border-white/90 shadow-inner">
              <span className="text-2xl">{meta.icon}</span>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
          <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-violet-50 transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5 text-violet-600" />
          </button>
          <button onClick={onToggle} disabled={isToggling} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-amber-50 transition-colors disabled:opacity-50" title={mantra.isActive ? 'Hide' : 'Show'}>
            {isToggling
              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              : mantra.isActive ? <EyeOff className="h-3.5 w-3.5 text-amber-600" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
          </button>
          <button onClick={onDuplicate} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-blue-50 transition-colors" title="Duplicate">
            <Copy className="h-3.5 w-3.5 text-blue-500" />
          </button>
          <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>

        {/* Top badges */}
        <div className="absolute left-2 top-2 z-10 flex gap-1">
          {mantra.audioUrl && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm" title="Has recitation audio">
              <Music2 className="h-3 w-3 text-violet-500" />
            </div>
          )}
        </div>
        <div className="absolute right-2 top-2 z-10">
          <CategoryPill category={mantra.category} />
        </div>

        {/* Status dot */}
        <div className={`absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase backdrop-blur-sm
          ${mantra.isActive ? 'bg-emerald-500/90 text-white' : 'bg-black/40 text-white/80'}`}>
          <span className={`h-1 w-1 rounded-full ${mantra.isActive ? 'bg-white' : 'bg-white/60'}`} />
          {mantra.isActive ? 'Live' : 'Hidden'}
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-gray-900 leading-tight tracking-tight">{mantra.title.en}</h3>
          {mantra.title.hi && (
            <p className="mt-0.5 truncate text-xs font-semibold text-violet-500">{mantra.title.hi}</p>
          )}
          {mantra.title.sa && (
            <p className="mt-0.5 truncate text-[11px] text-orange-500 font-medium">{mantra.title.sa}</p>
          )}
        </div>

        {/* Mantra Sanskrit text preview */}
        {(mantra.text?.sa || mantra.text?.hi) && (
          <div className="mt-2 rounded-xl bg-linear-to-br from-violet-50 to-indigo-50 border border-violet-100/60 px-3 py-2">
            <p className="line-clamp-2 text-xs leading-relaxed text-violet-700 font-medium text-center">
              {mantra.text.sa || mantra.text.hi}
            </p>
          </div>
        )}

        {/* Deity */}
        {deityName && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-base">🙏</span>
            <div>
              <span className="text-[11px] font-bold text-orange-600">{deityName}</span>
              {deityHi && <span className="ml-1 text-[10px] text-orange-400">{deityHi}</span>}
            </div>
          </div>
        )}

        {/* Stats + actions */}
        <div className="mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 border border-amber-100">
                <Hash className="h-2.5 w-2.5" />{mantra.beadCount}
              </span>
              <span className="flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                🪙{mantra.coinsReward}
              </span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} title="Edit" className="rounded-xl p-1.5 text-gray-300 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={onToggle} disabled={isToggling} title={mantra.isActive ? 'Hide' : 'Show'} className="rounded-xl p-1.5 text-gray-300 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                {mantra.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={onDelete} title="Delete" className="rounded-xl p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mantra Row (List) ─────────────────────────────────────────
function MantraRow({
  mantra, index, onEdit, onToggle, onDelete, onDuplicate, isToggling,
}: {
  mantra: Mantra;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isToggling: boolean;
}) {
  const gradClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const deityName = typeof mantra.deityId === 'object' && mantra.deityId
    ? (mantra.deityId as Deity).name?.en
    : null;
  const meta = CATEGORY_META[mantra.category] ?? { label: mantra.category, color: 'text-gray-700', bg: 'bg-gray-100', icon: '📿' };

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-violet-100
        ${mantra.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60 hover:opacity-85'}`}
    >
      {/* Index */}
      <span className="w-7 shrink-0 text-center text-xs font-bold text-gray-300 tabular-nums">{index + 1}</span>

      {/* Thumbnail */}
      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br ${gradClass} border border-white shadow-sm ring-1 ring-black/5`}>
        {mantra.imageUrl ? (
          <img src={mantra.imageUrl} alt={mantra.title.en} className="h-full w-full object-contain p-1.5" />
        ) : (
          <span className="text-xl">{meta.icon}</span>
        )}
        {mantra.audioUrl && (
          <div className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 shadow-sm">
            <Music2 className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Titles & text */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-black text-sm text-gray-900">{mantra.title.en}</span>
          {mantra.title.hi && <span className="text-xs font-semibold text-violet-500">{mantra.title.hi}</span>}
        </div>
        {(mantra.text?.sa || mantra.text?.hi) && (
          <p className="mt-0.5 truncate text-xs text-orange-500 font-medium max-w-xs">
            {mantra.text.sa || mantra.text.hi}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="hidden sm:block shrink-0">
        <CategoryPill category={mantra.category} />
      </div>

      {/* Deity */}
      {deityName && (
        <span className="hidden lg:flex items-center gap-1 text-xs font-semibold text-orange-600 max-w-[110px] truncate shrink-0">
          🙏 {deityName}
        </span>
      )}

      {/* Beads + coins */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <span className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
          <Hash className="h-2.5 w-2.5" />{mantra.beadCount}
        </span>
        <span className="flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
          🪙{mantra.coinsReward}
        </span>
      </div>

      {/* Status */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50
          ${mantra.isActive
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        title={mantra.isActive ? 'Click to hide' : 'Click to show'}
      >
        {isToggling
          ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          : <span className={`h-1.5 w-1.5 rounded-full ${mantra.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        }
        {mantra.isActive ? 'Live' : 'Hidden'}
      </button>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} title="Edit" className="rounded-xl p-2 text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDuplicate} title="Duplicate" className="rounded-xl p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} title="Delete" className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({
  label, value, icon, active, onClick,
}: {
  label: string; value: number; icon: React.ReactNode; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 flex-col gap-1 overflow-hidden rounded-2xl px-4 py-3.5 text-left transition-all duration-200
        ${active ? 'bg-white/30 ring-2 ring-white/70 shadow-inner' : 'bg-white/15 hover:bg-white/25'}`}
    >
      <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-xl ${active ? 'bg-white/30' : 'bg-white/20'}`}>
        {icon}
      </div>
      <div className="text-3xl font-black leading-none tracking-tight text-white">{value}</div>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/75">{label}</p>
      {active && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-white/70 shadow" />}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function MantrasPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deityFilter, setDeityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(newMantraForm());
  const [deleteTarget, setDeleteTarget] = useState<Mantra | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'sa'>('en');
  const limit = 24;

  // ── Data Fetching ──
  const { data, isLoading } = useQuery<{ items: Mantra[]; meta: { totalItems: number; totalPages: number; currentPage: number } }>({
    queryKey: ['mantras', page, categoryFilter, deityFilter, statusFilter],
    queryFn: () => mantrasApi.getAll({
      page,
      limit,
      category: categoryFilter || undefined,
      deityId: deityFilter || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }).then(res => res.data),
  });

  const { data: deitiesData } = useQuery<{ items: Deity[] }>({
    queryKey: ['deities-all'],
    queryFn: () => deitiesApi.getAll({ limit: 100 }).then(res => res.data),
  });

  const deities: Deity[] = useMemo(() => {
    if (Array.isArray(deitiesData?.items)) return deitiesData.items;
    if (Array.isArray(deitiesData)) return deitiesData as unknown as Deity[];
    return [];
  }, [deitiesData]);

  const allMantras: Mantra[] = useMemo(() => data?.items ?? [], [data]);

  const mantras = useMemo(() => {
    if (!search.trim()) return allMantras;
    const q = search.toLowerCase();
    return allMantras.filter(m =>
      m.title.en.toLowerCase().includes(q) ||
      m.title.hi?.toLowerCase().includes(q) ||
      m.text?.en?.toLowerCase().includes(q),
    );
  }, [allMantras, search]);

  const totalPages = data?.meta?.totalPages ?? 1;
  const totalItems = data?.meta?.totalItems ?? 0;
  const activeCount = allMantras.filter(m => m.isActive).length;
  const inactiveCount = allMantras.length - activeCount;

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? mantrasApi.update(editingId, payload) : mantrasApi.create(payload),
    onSuccess: () => {
      toast.success(editingId ? 'Mantra updated!' : 'Mantra created!');
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
      closeModal();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.message || err?.message || 'Unknown error';
      toast.error(`Failed to save mantra: ${detail}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      mantrasApi.update(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Now visible in app' : 'Hidden from app');
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
      setTogglingId(null);
    },
    onError: () => { toast.error('Failed to update status'); setTogglingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mantrasApi.delete(id),
    onSuccess: () => {
      toast.success('Mantra deleted');
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete mantra'),
  });

  // ── Handlers ──
  const openCreate = () => { setEditingId(null); setForm(newMantraForm()); setActiveLang('en'); setModalOpen(true); };
  const openEdit = (m: Mantra) => {
    setEditingId(m._id);
    setForm({
      category: m.category,
      deityId: typeof m.deityId === 'string' ? m.deityId : (m.deityId as Deity)?._id ?? '',
      title: { en: m.title.en, hi: m.title.hi ?? '', sa: m.title.sa ?? '' },
      text: { en: m.text.en, hi: m.text.hi ?? '', sa: m.text.sa ?? '' },
      description: { en: m.description?.en ?? '', hi: m.description?.hi ?? '', sa: m.description?.sa ?? '' },
      imageUrl: m.imageUrl ?? '',
      audioUrl: m.audioUrl ?? '',
      beadCount: m.beadCount,
      coinsReward: m.coinsReward,
      isActive: m.isActive,
      sortOrder: m.sortOrder,
    });
    setActiveLang('en');
    setModalOpen(true);
  };
  const openDuplicate = (m: Mantra) => {
    setEditingId(null);
    setForm({
      category: m.category,
      deityId: typeof m.deityId === 'string' ? m.deityId : (m.deityId as Deity)?._id ?? '',
      title: { en: `${m.title.en} (copy)`, hi: m.title.hi ?? '', sa: m.title.sa ?? '' },
      text: { en: m.text.en, hi: m.text.hi ?? '', sa: m.text.sa ?? '' },
      description: { en: m.description?.en ?? '', hi: m.description?.hi ?? '', sa: m.description?.sa ?? '' },
      imageUrl: m.imageUrl ?? '',
      audioUrl: m.audioUrl ?? '',
      beadCount: m.beadCount,
      coinsReward: m.coinsReward,
      isActive: false,
      sortOrder: m.sortOrder + 1,
    });
    setActiveLang('en');
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSave = () => {
    if (!form.title.en.trim() || !form.text.en.trim()) {
      toast.error('English title and mantra text are required');
      return;
    }
    const payload: Record<string, unknown> = { ...form };
    if (!form.deityId) delete payload.deityId;
    saveMutation.mutate(payload);
  };

  const handleToggle = (m: Mantra) => {
    setTogglingId(m._id);
    toggleMutation.mutate({ id: m._id, isActive: !m.isActive });
  };

  const setI18n = (field: 'title' | 'text' | 'description', lang: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));

  // ── Render ──
  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 via-purple-500 to-indigo-500 p-5 text-white shadow-lg shadow-violet-200">
        {/* Decorative */}
        <div className="pointer-events-none absolute -right-8 -top-8 flex h-48 w-48 items-center justify-center rounded-full bg-white/5">
          <span className="text-9xl font-bold text-white/10 select-none">ॐ</span>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-32 h-16 w-16 rounded-full bg-white/10" />

        {/* Title row */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm ring-1 ring-white/30">
              <BookOpen className="h-5 w-5 text-white drop-shadow" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">Mantras</h1>
              <p className="mt-0.5 text-xs text-violet-100/90">
                {formatNumber(totalItems)} mantras &middot; changes sync to the app instantly
              </p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="relative bg-white text-violet-700 hover:bg-violet-50 shadow-md border-0 font-bold ring-1 ring-white/50"
          >
            <Plus className="h-4 w-4" />
            Add Mantra
          </Button>
        </div>

        {/* Stats */}
        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Total Mantras"
            value={totalItems}
            icon={<Layers className="h-3.5 w-3.5 text-white" />}
            active={statusFilter === 'all'}
            onClick={() => { setStatusFilter('all'); setPage(1); }}
          />
          <StatCard
            label="Live in App"
            value={activeCount}
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            active={statusFilter === 'active'}
            onClick={() => { setStatusFilter('active'); setPage(1); }}
          />
          <StatCard
            label="Hidden"
            value={inactiveCount}
            icon={<EyeOff className="h-3.5 w-3.5 text-white" />}
            active={statusFilter === 'inactive'}
            onClick={() => { setStatusFilter('inactive'); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or mantra text…"
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            {FILTER_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Deity filter */}
          <select
            value={deityFilter}
            onChange={(e) => { setDeityFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">All Deities</option>
            {deities.map(d => (
              <option key={d._id} value={d._id}>{d.name.en}</option>
            ))}
          </select>

          {/* Results badge */}
          {(search || categoryFilter || deityFilter || statusFilter !== 'all') && (
            <span className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600 border border-violet-100">
              {mantras.length} result{mantras.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* View mode */}
          <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-xl p-2 transition-all duration-150 ${viewMode === 'grid' ? 'bg-linear-to-br from-violet-500 to-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 transition-all duration-150 ${viewMode === 'list' ? 'bg-linear-to-br from-violet-500 to-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-100 border-t-violet-500" />
            <span className="absolute inset-0 flex items-center justify-center text-xl">ॐ</span>
          </div>
          <p className="text-sm text-gray-400 animate-pulse">Loading mantras&hellip;</p>
        </div>
      ) : mantras.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-100 bg-linear-to-b from-violet-50/50 to-white py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-violet-100 to-indigo-50 shadow-inner">
            <BookOpen className="h-10 w-10 text-violet-300" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-gray-900">
            {search || categoryFilter || deityFilter || statusFilter !== 'all' ? 'No mantras match' : 'No mantras yet'}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500 leading-relaxed">
            {search || categoryFilter || deityFilter || statusFilter !== 'all'
              ? 'Try clearing your filters.'
              : 'Add your first mantra to make it available in the app.'}
          </p>
          {!search && !categoryFilter && !deityFilter && statusFilter === 'all' && (
            <Button className="mt-6" size="lg" onClick={openCreate}>
              <Plus className="h-5 w-5" /> Add First Mantra
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mantras.map((m, i) => (
            <MantraCard
              key={m._id}
              mantra={m}
              index={i}
              onEdit={() => openEdit(m)}
              onToggle={() => handleToggle(m)}
              onDelete={() => setDeleteTarget(m)}
              onDuplicate={() => openDuplicate(m)}
              isToggling={togglingId === m._id}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-gray-50 bg-gray-50/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="w-7" />
            <span className="w-11" />
            <span className="flex-1">Mantra</span>
            <span className="hidden sm:block w-24">Category</span>
            <span className="hidden lg:block w-28">Deity</span>
            <span className="hidden sm:block w-32">Stats</span>
            <span className="w-20">Status</span>
            <span className="w-24 text-right pr-1">Actions</span>
          </div>
          <div className="divide-y divide-gray-50/80">
            {mantras.map((m, i) => (
              <div key={m._id} className="px-2 py-1.5">
                <MantraRow
                  mantra={m}
                  index={i}
                  onEdit={() => openEdit(m)}
                  onToggle={() => handleToggle(m)}
                  onDelete={() => setDeleteTarget(m)}
                  onDuplicate={() => openDuplicate(m)}
                  isToggling={togglingId === m._id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}

      {/* Count footer */}
      {!isLoading && mantras.length > 0 && totalPages <= 1 && (
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs text-gray-400 font-medium">{mantras.length} of {totalItems} mantras</span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}

      {/* ── Delete Confirm ── */}
      <DeleteConfirmDialog
        mantra={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="" className="max-w-3xl" closeBtnClass="text-white/70 hover:text-white hover:bg-white/20">
        {/* Modal header */}
        <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-2 -top-4 text-8xl font-bold text-white/8 select-none leading-none">ॐ</div>
          <div className="pointer-events-none absolute -bottom-3 left-24 h-16 w-16 rounded-full bg-white/5" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{editingId ? 'Edit Mantra' : 'Add New Mantra'}</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <Wifi className="h-3 w-3 text-emerald-300" />
                <p className="text-xs text-violet-100/90">
                  {editingId ? 'Changes sync to the mobile app instantly' : 'Saved mantras appear in the app immediately'}
                </p>
              </div>
            </div>
          </div>
          {/* Live sync badge */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
          {/* Left: Form */}
          <div className="space-y-5 min-w-0">
            {/* ── Identity ── */}
            <div>
              <SectionLabel>Category & Deity</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Category <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: 'god', label: 'Deity', icon: '🙏' },
                      { value: 'festival', label: 'Festival', icon: '🪔' },
                      { value: 'special', label: 'Special', icon: '✨' },
                      { value: 'custom', label: 'Custom', icon: '🎯' },
                    ].map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, category: c.value }))}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-150
                          ${form.category === c.value
                            ? 'border-violet-300 bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-200'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <span>{c.icon}</span>{c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Deity <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                  <select
                    value={form.deityId}
                    onChange={(e) => setForm((p) => ({ ...p, deityId: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">— None —</option>
                    {deities.map((d) => (
                      <option key={d._id} value={d._id}>{d.name.en}{d.name.hi ? ` (${d.name.hi})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Language Tabs ── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>Title, Text & Description</SectionLabel>
                <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
                  {([
                    { code: 'en' as const, label: 'EN', full: 'English' },
                    { code: 'hi' as const, label: 'HI', full: 'Hindi' },
                    { code: 'sa' as const, label: 'SA', full: 'Sanskrit' },
                  ]).map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveLang(lang.code)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                        activeLang === lang.code
                          ? 'bg-white text-violet-700 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={lang.full}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Title <span className={activeLang === 'en' ? 'text-red-400' : 'text-gray-300'}>*</span>
                  </label>
                  <Input
                    id={`title-${activeLang}`}
                    value={form.title[activeLang] ?? ''}
                    onChange={(e) => setI18n('title', activeLang, e.target.value)}
                    placeholder={activeLang === 'en' ? 'e.g. Hanuman Moola Mantra' : activeLang === 'hi' ? 'e.g. मूल मंत्र' : 'e.g. ॐ नमः शिवाय'}
                    required={activeLang === 'en'}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Mantra Text <span className={activeLang === 'en' ? 'text-red-400' : 'text-gray-300'}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.text[activeLang] ?? ''}
                    onChange={(e) => setI18n('text', activeLang, e.target.value)}
                    placeholder={activeLang === 'sa' ? 'ॐ हनुमते नमः' : activeLang === 'hi' ? 'मंत्र का पाठ…' : 'Mantra text…'}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Description / Meaning <span className="text-gray-300">(optional)</span></label>
                  <textarea
                    rows={2}
                    value={form.description[activeLang] ?? ''}
                    onChange={(e) => setI18n('description', activeLang, e.target.value)}
                    placeholder="Meaning or description…"
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* ── Media ── */}
            <div>
              <SectionLabel>Media</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <FileUpload
                  label="Mantra Image"
                  accept="image"
                  value={form.imageUrl}
                  onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                />
                <FileUpload
                  label="Mantra Audio (Recitation)"
                  accept="audio"
                  value={form.audioUrl}
                  onChange={(url) => setForm((p) => ({ ...p, audioUrl: url }))}
                />
              </div>
            </div>

            {/* ── Settings ── */}
            <div>
              <SectionLabel>Settings</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  id="beadCount"
                  label="Bead Count"
                  type="number"
                  value={form.beadCount}
                  onChange={(e) => setForm((p) => ({ ...p, beadCount: +e.target.value }))}
                />
                <Input
                  id="coinsReward"
                  label="Coins Reward 🪙"
                  type="number"
                  value={form.coinsReward}
                  onChange={(e) => setForm((p) => ({ ...p, coinsReward: +e.target.value }))}
                />
                <Input
                  id="sortOrder"
                  label="Sort Order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: +e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Right: Preview Panel */}
          <div className="hidden lg:flex flex-col gap-3">
            {/* App Preview */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">App Preview</p>
              <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-900 shadow-xl">
                {/* Phone status bar */}
                <div className="flex items-center justify-between bg-gray-900 px-3 py-1.5">
                  <span className="text-[9px] font-bold text-gray-500">9:41</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-1 w-1 rounded-full bg-gray-600" />)}
                  </div>
                </div>
                {/* Card mockup */}
                <div className="mx-2 mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="preview" className="h-24 w-full object-contain p-2" />
                  ) : (
                    <div className={`flex h-24 items-center justify-center bg-linear-to-br ${CARD_GRADIENTS[0]}`}>
                      <span className="text-4xl opacity-60">
                        {CATEGORY_META[form.category]?.icon ?? '📿'}
                      </span>
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-black text-gray-900 leading-tight">{form.title.en || 'Mantra Title'}</p>
                    {form.title.hi && <p className="mt-0.5 text-[10px] font-semibold text-violet-500">{form.title.hi}</p>}
                    {(form.text.sa || form.text.hi) && (
                      <p className="mt-1.5 text-[10px] text-orange-500 font-medium leading-relaxed text-center">
                        {form.text.sa || form.text.hi}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                        <Hash className="h-2 w-2" />{form.beadCount}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600">🪙 {form.coinsReward}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility toggle */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Visibility</p>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                className={`w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 transition-all duration-200
                  ${form.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100'
                    : 'border-red-200 bg-red-50 text-red-700'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${form.isActive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {form.isActive
                      ? <Eye className="h-4 w-4 text-emerald-600" />
                      : <EyeOff className="h-4 w-4 text-red-500" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-none ${form.isActive ? 'text-emerald-800' : 'text-red-700'}`}>
                      {form.isActive ? 'Visible in App' : 'Hidden from App'}
                    </p>
                    <p className={`mt-0.5 text-[10px] font-medium ${form.isActive ? 'text-emerald-500' : 'text-red-400'}`}>
                      {form.isActive ? 'Users can see this mantra' : 'Not shown to users'}
                    </p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            {/* Audio indicators */}
            {form.audioUrl && (
              <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                <Music2 className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="text-xs font-semibold text-violet-600">Recitation audio attached</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <div className="lg:hidden">
            {/* Mobile: visibility toggle */}
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`flex h-10 items-center gap-2 rounded-xl border-2 px-3 text-xs font-bold transition-all duration-200
                ${form.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-600'
                }`}
            >
              {form.isActive
                ? <Eye className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                : <EyeOff className="h-3.5 w-3.5 shrink-0 text-red-500" />}
              <span>{form.isActive ? 'Visible' : 'Hidden'}</span>
              <div className={`relative ml-1 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
          <div className="flex flex-1 justify-end gap-3">
            <Button variant="outline" onClick={closeModal} disabled={saveMutation.isPending}>Cancel</Button>
            <Button
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-white shadow-md shadow-violet-200 px-6"
            >
              <Sparkles className="h-4 w-4" />
              {editingId ? 'Save Changes' : 'Add Mantra'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
