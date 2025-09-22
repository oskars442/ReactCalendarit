'use client';

import type { ReactNode } from 'react';

type Props = {
  nav: ReactNode;
  children: ReactNode;
  /** whether the sidebar is visible (desktop only) */
  open: boolean;
};

export default function DashboardShell({ nav, children, open }: Props) {
  // izmantojam CSS mainīgo, lai gludi animētu platumu uz ≥md
  const sbWidth = open ? '220px' : '0px';

  return (
    <div
      className="min-h-[70vh] md:grid"
      style={{
        // tikai vizuālais: uz mobilā nav grid, tāpēc šis neko neietekmē
        gridTemplateColumns: `var(--sbw, 0px) 1fr`,
        // gludā animācija desktopam
        transition: 'grid-template-columns .2s ease',
        // iestādam mainīgo, ko izmantojam md režīmā
        // (varam mainīt dinamiski bez klasēm)
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
          // mobilajā neeksistē kolonna
          'hidden md:block',
          // tikai desktopā rādām robežu un fonu
          'md:box-border md:border-r md:border-neutral-200 md:bg-white',
          // kad atvērts, iekšējais paddings; kad ciet – bez padding un bez klikšķiem
          open
            ? 'md:px-4 md:py-4 md:opacity-100 md:pointer-events-auto'
            : 'md:p-0 md:opacity-0 md:pointer-events-none',
          // ritjoslas uz vertikāli, lai garie saraksti nerauj layoutu
          'overflow-x-hidden overflow-y-auto',
          // gluda opacity/padding animācija
          'transition-[opacity,padding] duration-200 ease-linear',
        ].join(' ')}
      >
        {nav}
      </aside>

      {/* Saturs */}
      <section className="relative p-4 md:p-6 min-w-0">
        {children}
      </section>
    </div>
  );
}
