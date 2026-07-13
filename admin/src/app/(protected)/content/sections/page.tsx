'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { I18nField } from '@/components/ui/i18n-field';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { formatNumber } from '@/lib/utils';
import type { Content, PaginatedResponse } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Search, Layers,
  LayoutGrid, List, Eye, EyeOff, X, AlertTriangle,
  CheckCircle2, Copy, BookOpen,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  festival: { label: 'Festival',     color: 'text-orange-700', bg: 'bg-orange-100/80', icon: '🪔' },
  god:      { label: 'God-Specific', color: 'text-violet-700', bg: 'bg-violet-100/80', icon: '🙏' },
  special:  { label: 'Special',      color: 'text-amber-700',  bg: 'bg-amber-100/80',  icon: '✨' },
  custom:   { label: 'Custom',       color: 'text-teal-700',   bg: 'bg-teal-100/80',   icon: '🎯' },
};

const FILTER_SECTIONS = [
  { value: '', label: 'All Sections' },
  { value: 'festival', label: 'Festival' },
  { value: 'god',      label: 'God-Specific' },
  { value: 'special',  label: 'Special' },
  { value: 'custom',   label: 'Custom' },
];

const CARD_GRADIENTS = [
  'from-orange-400/20 via-amber-300/10 to-yellow-100/5',
  'from-violet-400/20 via-purple-300/10 to-indigo-100/5',
  'from-rose-400/20 via-pink-300/10 to-fuchsia-100/5',
  'from-teal-400/20 via-emerald-300/10 to-green-100/5',
  'from-sky-400/20 via-blue-300/10 to-cyan-100/5',
  'from-amber-400/20 via-orange-300/10 to-red-100/5',
];

const ICON_OPTIONS = [
  { value: '',              label: 'None',                   emoji: '' },
  { value: 'candle',        label: 'Candle (Diwali)',        emoji: '🕯️' },
  { value: 'flower-lotus',  label: 'Lotus (Navratri)',       emoji: '🪷' },
  { value: 'om',            label: 'Om (Shivaratri)',        emoji: '🕉️' },
  { value: 'elephant',      label: 'Elephant (Ganesh)',      emoji: '🐘' },
  { value: 'palette',       label: 'Palette (Holi)',         emoji: '🎨' },
  { value: 'baby-carriage', label: 'Cradle (Janmashtami)',   emoji: '👶' },
  { value: 'bow-arrow',     label: 'Bow & Arrow (Dussehra)', emoji: '🏹' },
  { value: 'weather-sunny', label: 'Sun (Makar Sankranti)', emoji: '☀️' },
];

function getIconEmoji(iconName?: string): string {
  if (!iconName) return '';
  return ICON_OPTIONS.find((i) => i.value === iconName)?.emoji ?? iconName;
}

const emptyI18n = { en: '', hi: '', sa: '' };

function newForm() {
  return {
    section:   'festival' as string,
    slug:      '',
    title:     { ...emptyI18n },
    body:      { ...emptyI18n },
    iconName:  '',
    imageUrl:  '',
    isActive:  true,
    sortOrder: 0,
  };
}

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'grid' | 'list';

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionPill({ section, iconName }: { section: string; iconName?: string }) {
  const meta = SECTION_META[section] ?? { label: section, color: 'text-gray-700', bg: 'bg-gray-100', icon: '📿' };
  const emoji = getIconEmoji(iconName) || meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.bg} ${meta.color}`}>
      <span>{emoji}</span>{meta.label}
    </span>
  );
}

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

function DeleteConfirmDialog({
  content, onConfirm, onCancel, isLoading,
}: {
  content: Content | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!content) return null;
  return (
    <Modal isOpen={!!content} onClose={onCancel} title="" className="max-w-sm">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-red-100 to-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Delete Section Content</h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-800">&ldquo;{content.title.en}&rdquo;</span> will be
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

// ── Content Card (Grid View) ──────────────────────────────────────────────────
function ContentCard({
  content, index, onEdit, onToggle, onDelete, onDuplicate, isToggling,
}: {
  content: Content;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isToggling: boolean;
}) {
  const gradClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const meta = SECTION_META[content.section] ?? { label: content.section, color: 'text-gray-700', bg: 'bg-gray-100', icon: '📿' };
  const iconEmoji = getIconEmoji(content.iconName);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        ${content.isActive
          ? 'border-gray-100 hover:border-orange-200'
          : 'border-dashed border-gray-200 opacity-60 hover:opacity-85'
        }`}
    >
      {/* Top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${content.isActive ? 'from-orange-500 via-amber-400 to-yellow-400' : 'from-gray-200 to-gray-300'}`} />

      {/* Image / banner section */}
      <div className={`relative flex h-36 items-center justify-center overflow-hidden bg-linear-to-br ${gradClass}`}>
        {content.imageUrl ? (
          <div className="relative flex h-24 w-24 items-center justify-center">
            <img
              src={content.imageUrl}
              alt={content.title.en}
              className="relative z-10 h-full w-full rounded-2xl object-contain drop-shadow-lg ring-2 ring-white/40 transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm border border-white/90 shadow-inner">
              <span className="text-2xl">{iconEmoji || meta.icon}</span>
            </div>
          </div>
        )}

        {/* Hover overlay actions */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
          <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-orange-50 transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5 text-orange-600" />
          </button>
          <button onClick={onToggle} disabled={isToggling} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-amber-50 transition-colors disabled:opacity-50" title={content.isActive ? 'Hide' : 'Show'}>
            {isToggling
              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
              : content.isActive ? <EyeOff className="h-3.5 w-3.5 text-amber-600" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
          </button>
          <button onClick={onDuplicate} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-blue-50 transition-colors" title="Duplicate">
            <Copy className="h-3.5 w-3.5 text-blue-500" />
          </button>
          <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xl hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>

        {/* Top badge */}
        <div className="absolute right-2 top-2 z-10">
          <SectionPill section={content.section} iconName={content.iconName} />
        </div>

        {/* Status dot */}
        <div className={`absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase backdrop-blur-sm
          ${content.isActive ? 'bg-emerald-500/90 text-white' : 'bg-black/40 text-white/80'}`}>
          <span className={`h-1 w-1 rounded-full ${content.isActive ? 'bg-white' : 'bg-white/60'}`} />
          {content.isActive ? 'Live' : 'Hidden'}
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-gray-900 leading-tight tracking-tight">{content.title.en}</h3>
          {content.title.hi && (
            <p className="mt-0.5 truncate text-xs font-semibold text-orange-500">{content.title.hi}</p>
          )}
          {content.slug && (
            <p className="mt-0.5 truncate text-[11px] text-gray-400">/{content.slug}</p>
          )}
        </div>

        {/* Body preview */}
        {(content.body?.en || content.body?.hi) && (
          <div className="mt-2 rounded-xl bg-linear-to-br from-orange-50 to-amber-50 border border-orange-100/60 px-3 py-2">
            <p className="line-clamp-2 text-xs leading-relaxed text-orange-700 font-medium">
              {content.body.en || content.body.hi}
            </p>
          </div>
        )}

        {/* Footer: sort order + actions */}
        <div className="mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-600 border border-gray-100">
                #{content.sortOrder}
              </span>
              {content.iconName && (
                <span className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 border border-amber-100">
                  {iconEmoji}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} title="Edit" className="rounded-xl p-1.5 text-gray-300 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={onToggle} disabled={isToggling} title={content.isActive ? 'Hide' : 'Show'} className="rounded-xl p-1.5 text-gray-300 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                {content.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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

// ── Content Row (List View) ───────────────────────────────────────────────────
function ContentRow({
  content, index, onEdit, onToggle, onDelete, onDuplicate, isToggling,
}: {
  content: Content;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isToggling: boolean;
}) {
  const gradClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const meta = SECTION_META[content.section] ?? { label: content.section, color: 'text-gray-700', bg: 'bg-gray-100', icon: '📿' };
  const iconEmoji = getIconEmoji(content.iconName);

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-100
        ${content.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60 hover:opacity-85'}`}
    >
      <span className="w-7 shrink-0 text-center text-xs font-bold text-gray-300 tabular-nums">{index + 1}</span>

      {/* Thumbnail */}
      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br ${gradClass} border border-white shadow-sm ring-1 ring-black/5`}>
        {content.imageUrl ? (
          <>
            <img src={content.imageUrl} alt={content.title.en} className="h-full w-full object-contain p-1.5" />
          </>
        ) : (
          <span className="text-xl">{iconEmoji || meta.icon}</span>
        )}
      </div>

      {/* Titles */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-black text-sm text-gray-900">{content.title.en}</span>
          {content.title.hi && <span className="text-xs font-semibold text-orange-500">{content.title.hi}</span>}
        </div>
        {content.slug && (
          <p className="mt-0.5 truncate text-xs text-gray-400 max-w-xs">/{content.slug}</p>
        )}
      </div>

      {/* Section badge */}
      <div className="hidden sm:block shrink-0">
        <SectionPill section={content.section} iconName={content.iconName} />
      </div>

      {/* Sort order */}
      <span className="hidden sm:flex items-center gap-0.5 rounded-lg bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500 border border-gray-100 shrink-0">
        #{content.sortOrder}
      </span>

      {/* Status toggle */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50
          ${content.isActive
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        title={content.isActive ? 'Click to hide' : 'Click to show'}
      >
        {isToggling
          ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          : <span className={`h-1.5 w-1.5 rounded-full ${content.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        }
        {content.isActive ? 'Live' : 'Hidden'}
      </button>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} title="Edit" className="rounded-xl p-2 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors">
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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ContentSectionsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(newForm());
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const limit = 24;

  // ── Data ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['content-sections', page, sectionFilter, statusFilter],
    queryFn: () => contentApi.getAll({
      page,
      limit,
      section: sectionFilter || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
  });

  const allItems: Content[] = useMemo(() => (data?.data?.items ?? []) as Content[], [data]);

  const items = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter(c =>
      c.title.en.toLowerCase().includes(q) ||
      c.title.hi?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q),
    );
  }, [allItems, search]);

  const totalPages: number = data?.data?.meta?.totalPages ?? data?.data?.totalPages ?? 1;
  const totalItems: number = data?.data?.meta?.totalItems ?? data?.data?.totalItems ?? 0;
  const activeCount = allItems.filter(c => c.isActive).length;
  const inactiveCount = allItems.length - activeCount;

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? contentApi.update(editingId, payload) : contentApi.create(payload),
    onSuccess: () => {
      toast.success(editingId ? 'Content updated!' : 'Content created!');
      queryClient.invalidateQueries({ queryKey: ['content-sections'] });
      closeModal();
    },
    onError: () => toast.error('Failed to save content'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      contentApi.update(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Now visible in app' : 'Hidden from app');
      queryClient.invalidateQueries({ queryKey: ['content-sections'] });
      setTogglingId(null);
    },
    onError: () => { toast.error('Failed to update status'); setTogglingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.delete(id),
    onSuccess: () => {
      toast.success('Content deleted');
      queryClient.invalidateQueries({ queryKey: ['content-sections'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete content'),
  });

  // ── Handlers ──
  const openCreate = () => { setEditingId(null); setForm(newForm()); setModalOpen(true); };
  const openEdit = (c: Content) => {
    setEditingId(c._id);
    setForm({
      section:   c.section,
      slug:      c.slug ?? '',
      title:     { en: c.title.en, hi: c.title.hi, sa: c.title.sa ?? '' },
      body:      { en: c.body?.en ?? '', hi: c.body?.hi ?? '', sa: c.body?.sa ?? '' },
      iconName:  c.iconName ?? '',
      imageUrl:  c.imageUrl ?? '',
      isActive:  c.isActive,
      sortOrder: c.sortOrder,
    });
    setModalOpen(true);
  };
  const openDuplicate = (c: Content) => {
    setEditingId(null);
    setForm({
      section:   c.section,
      slug:      `${c.slug ?? ''}-copy`,
      title:     { en: `${c.title.en} (copy)`, hi: c.title.hi, sa: c.title.sa ?? '' },
      body:      { en: c.body?.en ?? '', hi: c.body?.hi ?? '', sa: c.body?.sa ?? '' },
      iconName:  c.iconName ?? '',
      imageUrl:  c.imageUrl ?? '',
      isActive:  false,
      sortOrder: c.sortOrder + 1,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSave = () => {
    if (!form.title.en.trim()) {
      toast.error('English title is required');
      return;
    }
    saveMutation.mutate(form as unknown as Record<string, unknown>);
  };

  const handleToggle = (c: Content) => {
    setTogglingId(c._id);
    toggleMutation.mutate({ id: c._id, isActive: !c.isActive });
  };

  const setI18n = (field: 'title' | 'body', lang: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));

  // ── Render ──
  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-500 via-amber-500 to-yellow-500 p-5 text-white shadow-lg shadow-orange-200">
        {/* Decorative elements */}
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
              <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">Content Sections</h1>
              <p className="mt-0.5 text-xs text-orange-100/90">
                {formatNumber(totalItems)} items &middot; changes sync to the app instantly
              </p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="relative bg-white text-orange-700 hover:bg-orange-50 shadow-md border-0 font-bold ring-1 ring-white/50"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </Button>
        </div>

        {/* Stats */}
        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Total Items"
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
            placeholder="Search by title or slug…"
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
          {/* Section filter */}
          <select
            value={sectionFilter}
            onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            {FILTER_SECTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Results badge */}
          {(search || sectionFilter || statusFilter !== 'all') && (
            <span className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 border border-orange-100">
              {items.length} result{items.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* View mode toggle */}
          <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-xl p-2 transition-all duration-150 ${viewMode === 'grid' ? 'bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 transition-all duration-150 ${viewMode === 'list' ? 'bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            <span className="absolute inset-0 flex items-center justify-center text-xl">ॐ</span>
          </div>
          <p className="text-sm text-gray-400 animate-pulse">Loading sections&hellip;</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-100 bg-linear-to-b from-orange-50/50 to-white py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-orange-100 to-amber-50 shadow-inner">
            <BookOpen className="h-10 w-10 text-orange-300" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-gray-900">
            {search || sectionFilter || statusFilter !== 'all' ? 'No content matches' : 'No content yet'}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500 leading-relaxed">
            {search || sectionFilter || statusFilter !== 'all'
              ? 'Try clearing your filters.'
              : 'Add your first section content to make it available in the app.'}
          </p>
          {!search && !sectionFilter && statusFilter === 'all' && (
            <Button className="mt-6" size="lg" onClick={openCreate}>
              <Plus className="h-5 w-5" /> Add First Content
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((c, i) => (
            <ContentCard
              key={c._id}
              content={c}
              index={i}
              onEdit={() => openEdit(c)}
              onToggle={() => handleToggle(c)}
              onDelete={() => setDeleteTarget(c)}
              onDuplicate={() => openDuplicate(c)}
              isToggling={togglingId === c._id}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-gray-50 bg-gray-50/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="w-7" />
            <span className="w-11" />
            <span className="flex-1">Content</span>
            <span className="hidden sm:block w-28">Section</span>
            <span className="hidden sm:block w-16">Order</span>
            <span className="w-20">Status</span>
            <span className="w-24 text-right pr-1">Actions</span>
          </div>
          <div className="divide-y divide-gray-50/80">
            {items.map((c, i) => (
              <div key={c._id} className="px-2 py-1.5">
                <ContentRow
                  content={c}
                  index={i}
                  onEdit={() => openEdit(c)}
                  onToggle={() => handleToggle(c)}
                  onDelete={() => setDeleteTarget(c)}
                  onDuplicate={() => openDuplicate(c)}
                  isToggling={togglingId === c._id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}
      {!isLoading && items.length > 0 && totalPages <= 1 && (
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs text-gray-400 font-medium">{items.length} of {totalItems} items</span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}

      {/* ── Delete Confirm ── */}
      <DeleteConfirmDialog
        content={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="" className="max-w-2xl" closeBtnClass="text-white/70 hover:text-white hover:bg-white/20">
        {/* Modal header */}
        <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-xl bg-linear-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-2 -top-4 text-8xl font-bold text-white/8 select-none leading-none">ॐ</div>
          <div className="pointer-events-none absolute -bottom-3 left-24 h-16 w-16 rounded-full bg-white/5" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
              {editingId ? <Pencil className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {editingId ? 'Edit Content' : 'Add Content'}
              </h2>
              <p className="mt-0.5 text-xs text-orange-100/80">
                {editingId ? 'Update the section content below' : 'Fill in the details to add new section content'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
        <div className="space-y-5">
          {/* Section + Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Section</label>
              <select
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="festival">🪔 Festival</option>
                <option value="god">🙏 God-Specific</option>
                <option value="special">✨ Special</option>
                <option value="custom">🎯 Custom</option>
              </select>
            </div>
            <Input
              id="slug"
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="e.g. diwali"
            />
          </div>

          {/* I18n Title */}
          <I18nField label="Title" name="title" values={form.title} onChange={(l, v) => setI18n('title', l, v)} required />

          {/* I18n Body */}
          <I18nField label="Body / Description" name="body" values={form.body} onChange={(l, v) => setI18n('body', l, v)} multiline />

          {/* Icon picker */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Icon (for mobile app)</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.filter((i) => i.value).map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, iconName: p.iconName === icon.value ? '' : icon.value }))}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-all ${
                    form.iconName === icon.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{icon.emoji}</span>
                  <span className="text-xs">{icon.label}</span>
                </button>
              ))}
            </div>
            {form.iconName && (
              <p className="mt-1.5 text-xs text-gray-500">
                Selected: <code className="rounded bg-orange-50 px-1.5 py-0.5 text-orange-600 text-[11px] font-semibold border border-orange-100">{form.iconName}</code>
              </p>
            )}
          </div>

          {/* Image upload */}
          <FileUpload
            label="Image (optional)"
            accept="image"
            value={form.imageUrl}
            onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
          />

          {/* Sort order + Active toggle */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="sortOrder"
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((p) => ({ ...p, sortOrder: +e.target.value }))}
            />
            <div className="flex items-end pb-1">
              <label className="relative inline-flex cursor-pointer items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`h-6 w-11 rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {form.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {form.isActive ? 'Visible in the app' : 'Hidden from app'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saveMutation.isPending}>
              {editingId ? 'Update Content' : 'Create Content'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
