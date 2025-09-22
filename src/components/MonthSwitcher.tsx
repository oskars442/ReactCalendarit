'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  direction: 'prev' | 'next';
};

/**
 * MonthSwitcher – single arrow button that shifts ?month by -1 or +1.
 * Accepts: direction="prev" | "next"
 */
export default function MonthSwitcher({ direction }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // current month (YYYY-MM) from query or "today"
  const currentMonthParam = searchParams.get('month') ?? '';
  const base = currentMonthParam
    ? new Date(`${currentMonthParam}-01T00:00:00`)
    : new Date();

  // compute target month
  const delta = direction === 'prev' ? -1 : 1;
  const target = new Date(base.getFullYear(), base.getMonth() + delta, 1);

  const nextParam = `${target.getFullYear()}-${String(
    target.getMonth() + 1
  ).padStart(2, '0')}`;

  const onClick = () => {
    const sp = new URLSearchParams(searchParams);
    sp.set('month', nextParam);
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous month' : 'Next month'}
      style={{
        padding: '8px 12px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: 'white',
        lineHeight: 1,
        cursor: 'pointer',
      }}
    >
      {direction === 'prev' ? '←' : '→'}
    </button>
  );
}
