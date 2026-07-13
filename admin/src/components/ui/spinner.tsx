import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-[3px] border-gray-100" />
        <div className="absolute left-0 top-0 h-10 w-10 animate-spin rounded-full border-[3px] border-transparent border-t-orange-500" />
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3">
      <Spinner />
      <p className="text-xs font-medium text-gray-400 animate-pulse">Loading…</p>
    </div>
  );
}
