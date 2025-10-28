// src/components/MonthSwitcher.tsx
'use client';

import { useEffect, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  direction: 'prev' | 'next';
};

function parseMonthParam(monthParam: string | null): Date {
  // Expect "YYYY-MM". Build an ISO date at UTC midnight to avoid TZ drift.
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, 1, 0, 0, 0));
  }
  // Fallback to "today", normalized to first day of month (UTC).
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

function monthKey(d: Date): string {
  // Always format as YYYY-MM with leading zero
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * MonthSwitcher – single arrow button that shifts ?month by -1 or +1.
 * Accepts: direction="prev" | "next"
 */
export default function MonthSwitcher({ direction }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Current month as Date (UTC first-of-month)
  const base = useMemo(
    () => parseMonthParam(searchParams.get('month')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.get('month')] // only recompute when actual value changes
  );

  // Compute target month based on direction
  const target = useMemo(() => {
    const delta = direction === 'prev' ? -1 : 1;
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + delta, 1, 0, 0, 0));
  }, [base, direction]);

  const targetParam = monthKey(target);

  // Prefetch prev/next month routes for snappier transitions
  useEffect(() => {
    // prev
    const prev = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1));
    const spPrev = new URLSearchParams(searchParams);
    spPrev.set('month', monthKey(prev));
    router.prefetch(`${pathname}?${spPrev.toString()}`);

    // next
    const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
    const spNext = new URLSearchParams(searchParams);
    spNext.set('month', monthKey(next));
    router.prefetch(`${pathname}?${spNext.toString()}`);
  }, [base, pathname, router, searchParams]);

  const onClick = () => {
    if (isPending) return; // prevent spamming during transition

    startTransition(() => {
      const sp = new URLSearchParams(searchParams);
      sp.set('month', targetParam);

      // Avoid scroll jump; replace keeps history cleaner (optional)
      router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous month' : 'Next month'}
      title={direction === 'prev' ? 'Previous month' : 'Next month'}
      disabled={isPending}
      style={{
        padding: '8px 12px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: 'white',
        lineHeight: 1,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      {direction === 'prev' ? '←' : '→'}
    </button>
  );
}
