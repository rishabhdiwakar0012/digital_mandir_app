'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 px-4">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100">
          <span className="text-4xl font-black text-orange-400">404</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-all hover:bg-orange-600"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
