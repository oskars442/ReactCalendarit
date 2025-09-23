// src/components/DashboardShell.tsx
'use client';

import type { ReactNode } from 'react';

type Props = {
  nav: ReactNode;
  children: ReactNode;
  /** whether the sidebar is visible (desktop only) */
  open: boolean;
  /** when true, removes p-4 md:p-6 from the content section (full-bleed) */
  noPadding?: boolean;
};

export default function DashboardShell({ nav, children, open, noPadding }: Props) {
  // izmantojam CSS mainīgo, lai gludi animētu platumu uz ≥md
  const sbWidth = open ? '220px' : '0px';

  return (
    <div
      className="min-h-[70vh] md:grid"
      style={{
        gridTemplateColumns: `var(--sbw, 0px) 1fr`,
        transition: 'grid-template-columns .2s ease',
        ['--sbw' as any]: sbWidth,
      }}
    >
      {/* Sidebar kolonna — pilnībā paslēpta uz mobilā */}
      <aside
        role="complementary"
        aria-label="App menu"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={[
          'hidden md:block',
          'md:box-border md:border-r md:border-neutral-200 md:bg-white',
          open
            ? 'md:px-4 md:py-4 md:opacity-100 md:pointer-events-auto'
            : 'md:p-0 md:opacity-0 md:pointer-events-none',
          'overflow-x-hidden overflow-y-auto',
          'transition-[opacity,padding] duration-200 ease-linear',
        ].join(' ')}
      >
        {nav}
      </aside>

      {/* Saturs */}
      <section className={`relative min-w-0 ${noPadding ? '' : 'p-4 md:p-6'}`}>
        {children}
      </section>
    </div>
  );
}
