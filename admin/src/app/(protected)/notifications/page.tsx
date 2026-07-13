'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Notification, PaginatedResponse } from '@/lib/types';
import toast from 'react-hot-toast';
import { Send, Plus, Eye, Bell } from 'lucide-react';

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  sending: 'warning',
  sent: 'success',
  failed: 'danger',
};

const NOTIFICATION_TEMPLATES: Record<string, { title: { en: string; hi: string }; body: { en: string; hi: string } }> = {
  custom: { title: { en: '', hi: '' }, body: { en: '', hi: '' } },
  mala_reminder: {
    title: { en: '🙏 Your Mala is Waiting!', hi: '🙏 आपकी माला इंतज़ार कर रही है!' },
    body: { en: 'You have an incomplete mala. Come back and finish your jaap to earn blessings!', hi: 'आपकी माला अधूरी है। वापस आएं और अपना जाप पूरा करके आशीर्वाद प्राप्त करें!' },
  },
  streak_reminder: {
    title: { en: '🔥 Don\'t Break Your Streak!', hi: '🔥 अपनी स्ट्रीक न तोड़ें!' },
    body: { en: 'You haven\'t done your jaap today. Keep your streak alive!', hi: 'आज आपने जाप नहीं किया। अपनी स्ट्रीक जारी रखें!' },
  },
  festival: {
    title: { en: '🎉 Festival Special Jaap', hi: '🎉 त्योहार विशेष जाप' },
    body: { en: 'Celebrate this auspicious occasion with a special jaap session!', hi: 'इस शुभ अवसर पर विशेष जाप सत्र के साथ उत्सव मनाएं!' },
  },
  daily_prayer: {
    title: { en: '🙏 Daily Prayer Reminder', hi: '🙏 दैनिक प्रार्थना अनुस्मारक' },
    body: { en: 'Start your day with divine blessings. Do your daily jaap now!', hi: 'दिव्य आशीर्वाद से अपना दिन शुरू करें। अभी अपना दैनिक जाप करें!' },
  },
};

function newNotificationForm() {
  return {
    title: { en: '', hi: '' },
    body: { en: '', hi: '' },
    type: 'push' as string,
    targetAudience: 'all' as string,
    targetRoles: [] as string[],
    category: 'custom' as string,
  };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(newNotificationForm());
  const limit = 20;

  const { data, isLoading } = useQuery<{ data: PaginatedResponse<Notification> }>({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.getAll({ page, limit }),
  });

  const { data: detailData } = useQuery<{ data: Notification }>({
    queryKey: ['notification', detailId],
    queryFn: () => notificationsApi.getById(detailId!),
    enabled: !!detailId,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => notificationsApi.send(payload),
    onSuccess: () => {
      toast.success('Notification sent');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setComposeOpen(false);
      setForm(newNotificationForm());
    },
    onError: () => toast.error('Failed to send notification'),
  });

  const handleSend = () => {
    if (!form.title.en || !form.body.en) {
      toast.error('English title and body are required');
      return;
    }
    sendMutation.mutate(form as unknown as Record<string, unknown>);
  };

  const notifications = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const detail = detailData?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Send and manage push notifications</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Send className="h-4 w-4" /> Compose
        </Button>
      </div>

      {/* Notification History */}
      {isLoading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No notifications sent yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Audience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <tr key={n._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{n.title.en}</p>
                      <p className="text-xs text-gray-500 max-w-[200px] truncate">{n.body.en}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge>{n.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{n.targetAudience.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariants[n.status]}>{n.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-green-600">{formatNumber(n.deliveredCount)}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-gray-600">{formatNumber(n.totalRecipients)}</span>
                      {n.failedCount > 0 && (
                        <span className="ml-1 text-xs text-red-500">({n.failedCount} failed)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {n.sentAt ? formatDate(n.sentAt) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDetailId(n._id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-6 py-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <Modal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose Notification"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Select
            id="category"
            label="Category"
            value={form.category}
            onChange={(e) => {
              const cat = e.target.value;
              const template = NOTIFICATION_TEMPLATES[cat] || NOTIFICATION_TEMPLATES.custom;
              setForm((p) => ({
                ...p,
                category: cat,
                title: { en: template.title.en, hi: template.title.hi },
                body: { en: template.body.en, hi: template.body.hi },
              }));
            }}
            options={[
              { value: 'custom', label: '✏️ Custom' },
              { value: 'mala_reminder', label: '🙏 Mala Reminder' },
              { value: 'streak_reminder', label: '🔥 Streak Reminder' },
              { value: 'festival', label: '🎉 Festival Special' },
              { value: 'daily_prayer', label: '🕉️ Daily Prayer' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="title-en"
              label="Title (English)"
              value={form.title.en}
              onChange={(e) => setForm((p) => ({ ...p, title: { ...p.title, en: e.target.value } }))}
              required
            />
            <Input
              id="title-hi"
              label="Title (Hindi)"
              value={form.title.hi}
              onChange={(e) => setForm((p) => ({ ...p, title: { ...p.title, hi: e.target.value } }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea
              id="body-en"
              label="Body (English)"
              value={form.body.en}
              onChange={(e) => setForm((p) => ({ ...p, body: { ...p.body, en: e.target.value } }))}
              required
            />
            <Textarea
              id="body-hi"
              label="Body (Hindi)"
              value={form.body.hi}
              onChange={(e) => setForm((p) => ({ ...p, body: { ...p.body, hi: e.target.value } }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="type"
              label="Type"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              options={[
                { value: 'push', label: 'Push' },
                { value: 'in-app', label: 'In-App' },
                { value: 'both', label: 'Both' },
              ]}
            />
            <Select
              id="targetAudience"
              label="Target Audience"
              value={form.targetAudience}
              onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'role_based', label: 'Role-Based' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} isLoading={sendMutation.isPending}>
              <Send className="h-4 w-4" /> Send Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title="Notification Details"
      >
        {detail ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Title</p>
              <p className="font-medium">{detail.title.en}</p>
              {detail.title.hi && <p className="text-sm text-gray-500">{detail.title.hi}</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Body</p>
              <p className="text-sm">{detail.body.en}</p>
              {detail.body.hi && <p className="text-sm text-gray-500">{detail.body.hi}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-500">Type</p>
                <p>{detail.type}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Audience</p>
                <p>{detail.targetAudience}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Category</p>
                <Badge variant="info">{(detail.category || 'custom').replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="font-medium text-gray-500">Status</p>
                <Badge variant={statusVariants[detail.status]}>{detail.status}</Badge>
              </div>
              <div>
                <p className="font-medium text-gray-500">Sent At</p>
                <p>{detail.sentAt ? formatDate(detail.sentAt) : '—'}</p>
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Delivery Stats</p>
              <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Total:</span>{' '}
                  <span className="font-semibold">{formatNumber(detail.totalRecipients)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Delivered:</span>{' '}
                  <span className="font-semibold text-green-600">{formatNumber(detail.deliveredCount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Failed:</span>{' '}
                  <span className="font-semibold text-red-600">{formatNumber(detail.failedCount)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PageLoader />
        )}
      </Modal>
    </div>
  );
}
