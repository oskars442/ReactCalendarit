//src/components/MonthQuickPick.tsx

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  date: Date;           // pašreizējais mēnesis (1. datums)
  locale?: string;      // piem. "lv-LV"
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function capitalizeFirst(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function MonthQuickPick({ date, locale = 'lv-LV' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [open, setOpen] = useState<'year' | 'month' | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // aizver uz klikšķi ārpus vai ESC
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const y = date.getFullYear();
  const m = date.getMonth(); // 0..11

  const labelLv =
    locale.toLowerCase().startsWith('lv')
      ? `${y}. g. ${capitalizeFirst(date.toLocaleDateString('lv-LV', { month: 'long' }))}`
      : capitalizeFirst(date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }));

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        capitalizeFirst(new Date(2024, i, 1).toLocaleDateString(locale, { month: 'long' }))
      ),
    [locale]
  );

  const yearOptions = useMemo(() => {
    const base = y;
    const min = base - 7;
    const max = base + 7;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [y]);

  function pushMonth(newYear: number, newMonth0: number) {
    const params = new URLSearchParams(sp.toString());
    params.set('month', `${newYear}-${pad2(newMonth0 + 1)}`);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(null);
  }

  return (
    <div ref={wrapRef} className="relative inline-flex items-center gap-2">
      {/* Gada poga */}
      <button
        type="button"
        onClick={() => setOpen(open === 'year' ? null : 'year')}
       className="cursor-pointer rounded-lg px-1.5 -mx-1.5 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 select-none"
        aria-expanded={open === 'year'}
        title="Izvēlēties gadu"
      >
        {/* “2026. g.” daļa tiek atvasināta no LV formatējuma */}
        <span className="font-bold">{y}.</span> <span className="opacity-60">g.</span>
      </button>

      {/* Mēneša poga */}
    <button
  type="button"
  onClick={() => setOpen(open === 'month' ? null : 'month')}
  className="cursor-pointer rounded-lg px-1.5 -mx-1.5 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400"
>
  <span className="font-bold">
    {capitalizeFirst(date.toLocaleDateString(locale, { month: 'long' }))}
  </span>
</button>

    {/* Gadu dropdown */}
{open === 'year' && (
  <div
    role="listbox"
    className="absolute left-0 top-full mt-2 z-50 w-44 rounded-xl border border-neutral-200/70 bg-white/95 backdrop-blur-sm shadow-md dark:bg-neutral-900/90 dark:border-neutral-700"
  >
    <ul className="max-h-64 overflow-auto py-1">
      {yearOptions.map((yy) => (
        <li key={yy}>
        <button
  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-[15px] cursor-pointer
    ${yy === y
      ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100 font-medium'
      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
    }`}
  onClick={() => pushMonth(yy, m)}
>
  {yy}
</button>
        </li>
      ))}
    </ul>
  </div>
)}

{/* Mēnešu dropdown (režģis 3x4) */}
{open === 'month' && (
  <div
    role="listbox"
    className="absolute left-0 top-full mt-2 z-50 w-80 rounded-xl border border-neutral-200/70 bg-white/95 backdrop-blur-sm shadow-md dark:bg-neutral-900/90 dark:border-neutral-700"
  >
    <div className="grid grid-cols-3 gap-2 p-3">
      {monthNames.map((name, idx) => (
     <button
  key={idx}
  className={`rounded-lg px-3 py-2 text-[15px] font-medium transition-all duration-100 cursor-pointer
    ${idx === m
      ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100 ring-2 ring-sky-400 font-semibold'
      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
    }`}
  onClick={() => pushMonth(y, idx)}
>
  {name}
</button>
      ))}
    </div>
  </div>
)}
    </div>
  );
}
