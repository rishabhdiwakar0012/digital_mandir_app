'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Trophy,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Flower2,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/content/mantras', label: 'Mantras', icon: BookOpen },
  { href: '/content/deities', label: 'Deities', icon: Flower2 },
  { href: '/content/sections', label: 'Content', icon: Settings },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  return (
    <>
      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <button onClick={() => setIsOpen(true)} className="rounded-lg p-1.5 hover:bg-gray-100">
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <span className="ml-3 text-lg font-bold text-orange-600">Digital Mandir Admin</span>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white/95 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-gray-50 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-200">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Admin</span>
          </Link>
          <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-gray-100 lg:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-linear-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-orange-600' : 'text-gray-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-50 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
