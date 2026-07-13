'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deitiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { I18nField } from '@/components/ui/i18n-field';
import { PageLoader } from '@/components/ui/spinner';
import type { Deity } from '@/lib/types';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Plus, Pencil, Trash2, Search, Sparkles,
  Image as ImageIcon, Hash, LayoutGrid, List,
  Eye, EyeOff, X, AlertTriangle, CheckCircle2,
  GripVertical, Flame, Archive, Layers,
} from 'lucide-react';

const emptyI18n = { en: '', hi: '', sa: '' };

function newDeityForm() {
  return {
    slug: '',
    name: { ...emptyI18n },
    description: { ...emptyI18n },
    imageUrl: '',
    isActive: true,
    sortOrder: 0,
  };
}

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'grid' | 'list';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CARD_GRADIENTS = [
  'from-orange-400/20 via-amber-300/10 to-yellow-200/5',
  'from-rose-400/20 via-pink-300/10 to-fuchsia-200/5',
  'from-violet-400/20 via-purple-300/10 to-indigo-200/5',
  'from-teal-400/20 via-emerald-300/10 to-green-200/5',
  'from-sky-400/20 via-blue-300/10 to-cyan-200/5',
  'from-amber-400/20 via-orange-300/10 to-red-200/5',
];
const cardGradient = (idx: number) => CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

// â”€â”€ Delete Confirmation Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DeleteConfirmDialog({
  deity, onConfirm, onCancel, isLoading,
}: {
  deity: Deity | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!deity) return null;
  return (
    <Modal isOpen={!!deity} onClose={onCancel} title="" className="max-w-sm">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-red-100 to-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Archive Deity</h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-800">&ldquo;{deity.name.en}&rdquo;</span> will be
            hidden from the app. You can restore it by making it active again.
          </p>
        </div>
        <div className="flex w-full gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} isLoading={isLoading}>
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// â”€â”€ Deity Card (Grid) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DeityCard({
  deity, index, onEdit, onToggle, onDelete, isToggling,
}: {
  deity: Deity;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        ${deity.isActive
          ? 'border-gray-100 hover:border-orange-200'
          : 'border-dashed border-gray-200 opacity-60 hover:opacity-80'
        }`}
    >
      {/* Thin top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-orange-400 via-amber-400 to-yellow-300" />

      {/* Image section */}
      <div
        className={`relative flex h-36 items-center justify-center overflow-hidden bg-linear-to-br ${cardGradient(index)}`}
      >
        {/* Radial halo glow behind image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-white/40 blur-2xl" />
        </div>

        {deity.imageUrl ? (
          <img
            src={deity.imageUrl}
            alt={deity.name.en}
            className="relative z-10 h-28 w-28 object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm border border-white/80">
              <ImageIcon className="h-6 w-6 text-orange-300" />
            </div>
            <span className="text-[10px] font-medium text-orange-400/80">No image</span>
          </div>
        )}

        {/* Hover action overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-1.5 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/25 group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-lg hover:bg-orange-50 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5 text-orange-600" />
          </button>
          <button
            onClick={onToggle}
            disabled={isToggling}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
            title={deity.isActive ? 'Hide from app' : 'Show in app'}
          >
            {isToggling
              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              : deity.isActive
                ? <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                : <Eye className="h-3.5 w-3.5 text-amber-600" />
            }
          </button>
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-lg hover:bg-red-50 transition-colors"
            title="Archive"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>

        {/* Sort order badge */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-gray-500 shadow-sm backdrop-blur-sm">
          <Hash className="h-3 w-3" />
          {deity.sortOrder}
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col p-3">
        {/* Status dot + name */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${deity.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`}
              />
              <h3 className="truncate text-sm font-bold text-gray-900 leading-tight">
                {deity.name.en}
              </h3>
            </div>
            {deity.name.hi && (
              <p className="mt-0.5 truncate pl-3 text-xs font-medium text-orange-500">
                {deity.name.hi}
              </p>
            )}
          </div>
        </div>

        {/* Slug */}
        <div className="mt-1.5">
          <code className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-mono text-orange-700 border border-orange-100">
            {deity.slug}
          </code>
        </div>

        {/* Bottom status bar */}
        <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
          <span className={`flex items-center gap-1 text-xs font-medium ${deity.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
            {deity.isActive
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Live in app</>
              : <><Archive className="h-3.5 w-3.5" /> Archived</>
            }
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onToggle}
              disabled={isToggling}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-40"
              title={deity.isActive ? 'Hide' : 'Show'}
            >
              {deity.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Archive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Deity Row (List view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DeityRow({
  deity, index, onEdit, onToggle, onDelete, isToggling,
}: {
  deity: Deity;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md
        ${deity.isActive ? 'border-gray-100 hover:border-orange-100' : 'border-dashed border-gray-200 opacity-60 hover:opacity-80'}`}
    >
      {/* Index */}
      <span className="w-6 shrink-0 text-right text-xs font-medium text-gray-300">
        {index + 1}
      </span>

      {/* Drag handle hint */}
      <GripVertical className="h-4 w-4 shrink-0 text-gray-200 group-hover:text-gray-300 transition-colors" />

      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br ${cardGradient(index)} border border-white shadow-sm`}
      >
        {deity.imageUrl ? (
          <img src={deity.imageUrl} alt={deity.name.en} className="h-full w-full object-contain p-1" />
        ) : (
          <ImageIcon className="h-5 w-5 text-orange-300" />
        )}
      </div>

      {/* Names & slug */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-bold text-gray-900">{deity.name.en}</span>
          {deity.name.hi && (
            <span className="text-sm font-medium text-orange-500">{deity.name.hi}</span>
          )}
          {deity.name.sa && (
            <span className="text-xs italic text-gray-400">{deity.name.sa}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <code className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-mono text-orange-700 border border-orange-100">
            {deity.slug}
          </code>
          {deity.description?.en && (
            <span className="hidden truncate text-xs text-gray-400 sm:block max-w-xs">
              {deity.description.en}
            </span>
          )}
        </div>
      </div>

      {/* Sort order */}
      <div className="hidden items-center gap-1 text-xs text-gray-400 sm:flex">
        <Hash className="h-3 w-3" />
        {deity.sortOrder}
      </div>

      {/* Status */}
      <span
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          deity.isActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${deity.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        {deity.isActive ? 'Live' : 'Archived'}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          title="Edit"
          className="rounded-xl p-2 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          disabled={isToggling}
          title={deity.isActive ? 'Hide from app' : 'Show in app'}
          className="rounded-xl p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50"
        >
          {isToggling
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            : deity.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
          }
        </button>
        <button
          onClick={onDelete}
          title="Archive"
          className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      {/* Icon badge */}
      <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-xl
        ${active ? 'bg-white/30' : 'bg-white/20'}`}>
        {icon}
      </div>
      {/* Count */}
      <div className="text-3xl font-black leading-none tracking-tight text-white">
        {value}
      </div>
      {/* Label */}
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/75">{label}</p>
      {/* Active indicator dot */}
      {active && (
        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-white/70 shadow" />
      )}
    </button>
  );
}

// â”€â”€ Section Label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-4 w-1 rounded-full bg-linear-to-b from-orange-500 to-amber-400" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{children}</p>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DeitiesPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(newDeityForm());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteTarget, setDeleteTarget] = useState<Deity | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ items: Deity[] }>({
    queryKey: ['deities'],
    queryFn: () => deitiesApi.getAll({ limit: 100 }).then(res => res.data),
  });

  const allDeities: Deity[] = useMemo(() => {
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data)) return data as unknown as Deity[];
    return [];
  }, [data]);

  const deities = useMemo(() => {
    let result = allDeities;
    if (statusFilter !== 'all') {
      result = result.filter(d => statusFilter === 'active' ? d.isActive : !d.isActive);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name.en.toLowerCase().includes(q) ||
        d.name.hi?.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allDeities, statusFilter, search]);

  const activeCount = allDeities.filter(d => d.isActive).length;
  const inactiveCount = allDeities.length - activeCount;

  // â”€â”€ Mutations â”€â”€
  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? deitiesApi.update(editingId, payload) : deitiesApi.create(payload),
    onSuccess: () => {
      toast.success(editingId ? 'Deity updated!' : 'Deity created!');
      queryClient.invalidateQueries({ queryKey: ['deities'] });
      closeModal();
    },
    onError: () => toast.error('Failed to save deity'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      deitiesApi.update(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Now visible in app' : 'Hidden from app');
      queryClient.invalidateQueries({ queryKey: ['deities'] });
      setTogglingId(null);
    },
    onError: () => { toast.error('Failed to update status'); setTogglingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deitiesApi.delete(id),
    onSuccess: () => {
      toast.success('Deity archived');
      queryClient.invalidateQueries({ queryKey: ['deities'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to archive deity'),
  });

  // â”€â”€ Handlers â”€â”€
  const openCreate = () => { setEditingId(null); setForm(newDeityForm()); setModalOpen(true); };
  const openEdit = (d: Deity) => {
    setEditingId(d._id);
    setForm({
      slug: d.slug,
      name: { en: d.name.en, hi: d.name.hi, sa: d.name.sa ?? '' },
      description: { en: d.description?.en ?? '', hi: d.description?.hi ?? '', sa: d.description?.sa ?? '' },
      imageUrl: d.imageUrl ?? '',
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };
  const handleSave = () => {
    if (!form.name.en.trim() || !form.slug.trim()) {
      toast.error('Slug and English name are required');
      return;
    }
    saveMutation.mutate(form as unknown as Record<string, unknown>);
  };
  const handleToggle = (d: Deity) => {
    setTogglingId(d._id);
    toggleMutation.mutate({ id: d._id, isActive: !d.isActive });
  };
  const setI18n = (field: 'name' | 'description', lang: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-6">

      {/* â”€â”€ Hero Header â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-500 via-amber-500 to-yellow-400 p-5 text-white shadow-lg shadow-orange-200">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -right-8 -top-8 flex h-48 w-48 items-center justify-center rounded-full bg-white/5">
          <span className="text-9xl font-bold text-white/10 select-none">ॐ</span>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-32 h-16 w-16 rounded-full bg-white/10" />

        {/* Title row */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm ring-1 ring-white/30">
              <Flame className="h-5 w-5 text-white drop-shadow" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">Deities</h1>
              <p className="mt-0.5 text-xs text-orange-100/90">
                Manage sacred deities &middot; changes sync to the app instantly
              </p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="relative bg-white text-orange-600 hover:bg-orange-50 shadow-md border-0 font-bold ring-1 ring-white/50"
          >
            <Plus className="h-4 w-4" />
            Add Deity
          </Button>
        </div>

        {/* Stats */}
        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Total Deities"
            value={allDeities.length}
            icon={<Layers className="h-3.5 w-3.5 text-white" />}
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatCard
            label="Live in App"
            value={activeCount}
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            active={statusFilter === 'active'}
            onClick={() => setStatusFilter('active')}
          />
          <StatCard
            label="Archived"
            value={inactiveCount}
            icon={<Archive className="h-3.5 w-3.5 text-white" />}
            active={statusFilter === 'inactive'}
            onClick={() => setStatusFilter('inactive')}
          />
        </div>
      </div>

      {/* â”€â”€ Toolbar â”€â”€ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, Hindi, or slug…"
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

        <div className="flex items-center gap-2">
          {/* Results badge when filtered */}
          {(search || statusFilter !== 'all') && (
            <span className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 border border-orange-100">
              {deities.length} result{deities.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* View mode */}
          <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-xl p-2 transition-all duration-150 ${
                viewMode === 'grid'
                  ? 'bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 transition-all duration-150 ${
                viewMode === 'list'
                  ? 'bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            <span className="absolute inset-0 flex items-center justify-center text-xl">ॐ</span>
          </div>
          <p className="text-sm text-gray-400 animate-pulse">Loading deities&hellip;</p>
        </div>
      ) : deities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-100 bg-linear-to-b from-orange-50/50 to-white py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-orange-100 to-amber-50 shadow-inner">
            <Flame className="h-10 w-10 text-orange-400" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-gray-900">
            {search || statusFilter !== 'all' ? 'No deities match' : 'No deities yet'}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500 leading-relaxed">
            {search || statusFilter !== 'all'
              ? 'Try clearing your search or switching to "All".'
              : 'Create your first deity to make it available in the Digital Mandir app for users to select.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Button className="mt-6" size="lg" onClick={openCreate}>
              <Plus className="h-5 w-5" /> Add First Deity
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {deities.map((d, i) => (
            <DeityCard
              key={d._id}
              deity={d}
              index={i}
              onEdit={() => openEdit(d)}
              onToggle={() => handleToggle(d)}
              onDelete={() => setDeleteTarget(d)}
              isToggling={togglingId === d._id}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {/* List header */}
          <div className="flex items-center gap-4 border-b border-gray-50 bg-gray-50/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="w-6" />
            <span className="w-4" />
            <span className="w-14" />
            <span className="flex-1">Deity</span>
            <span className="hidden sm:block w-8">Order</span>
            <span className="w-20">Status</span>
            <span className="w-24 text-right pr-1">Actions</span>
          </div>
          <div className="divide-y divide-gray-50">
            {deities.map((d, i) => (
              <div key={d._id} className="px-2 py-1.5">
                <DeityRow
                  deity={d}
                  index={i}
                  onEdit={() => openEdit(d)}
                  onToggle={() => handleToggle(d)}
                  onDelete={() => setDeleteTarget(d)}
                  isToggling={togglingId === d._id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Count footer */}
      {!isLoading && allDeities.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs text-gray-400 font-medium">
            {deities.length} of {allDeities.length} deities
          </span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}

      {/* â”€â”€ Create / Edit Modal â”€â”€ */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="" className="max-w-2xl" closeBtnClass="text-white/70 hover:text-white hover:bg-white/20">
        {/* Modal header */}
        <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-xl bg-linear-to-r from-orange-500 to-amber-400 px-6 py-5 text-white">
          <div className="pointer-events-none absolute right-4 top-2 text-6xl font-bold text-white/10 select-none">ॐ</div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black">
                {editingId ? 'Edit Deity' : 'Add New Deity'}
              </h2>
              <p className="text-xs text-orange-100">
                {editingId
                  ? 'Changes sync to the app instantly'
                  : 'New deities appear on the app after saving'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* â”€â”€ Identity â”€â”€ */}
          <div>
            <SectionLabel>Identity</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="slug"
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g. ganesh"
                required
              />
              <Input
                id="sortOrder"
                label="Display Order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: +e.target.value }))}
              />
            </div>
          </div>

          {/* â”€â”€ Names â”€â”€ */}
          <div>
            <SectionLabel>Names</SectionLabel>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
              <I18nField
                label="Display Name"
                name="name"
                values={form.name}
                onChange={(l, v) => setI18n('name', l, v)}
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Sanskrit <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.name.sa || ''}
                  onChange={(e) => setI18n('name', 'sa', e.target.value)}
                  placeholder="Sanskrit name"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          {/* â”€â”€ Description â”€â”€ */}
          <div>
            <SectionLabel>Description</SectionLabel>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <I18nField
                label="Description"
                name="description"
                values={form.description}
                onChange={(l, v) => setI18n('description', l, v)}
                multiline
              />
            </div>
          </div>

          {/* â”€â”€ Image â”€â”€ */}
          <div>
            <SectionLabel>Image</SectionLabel>
            <FileUpload
              label="Deity Image"
              accept="image"
              value={form.imageUrl}
              onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
            />
            {form.imageUrl && (
              <div className="mt-3 flex items-center gap-4 rounded-2xl border border-orange-100 bg-linear-to-r from-orange-50 to-amber-50 p-3.5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-orange-100 shadow-sm">
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-contain p-1.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Image Preview</p>
                  <p className="mt-0.5 text-[11px] text-gray-400 truncate">{form.imageUrl}</p>
                </div>
                <button
                  onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                  className="shrink-0 rounded-xl p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* â”€â”€ Visibility â”€â”€ */}
          <div>
            <SectionLabel>Visibility</SectionLabel>
            <div
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3.5 transition-all ${
                form.isActive
                  ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${form.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {form.isActive
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <Archive className="h-5 w-5 text-gray-400" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {form.isActive ? 'Visible in App' : 'Hidden from App'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {form.isActive
                      ? 'Users can select this deity in the app'
                      : 'This deity is archived and not shown to users'}
                  </p>
                </div>
              </div>
              {/* Toggle switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                  form.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    form.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* â”€â”€ Actions â”€â”€ */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              className="min-w-32"
            >
              {editingId ? 'Save Changes' : 'Create Deity'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* â”€â”€ Archive Confirmation â”€â”€ */}
      <DeleteConfirmDialog
        deity={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
