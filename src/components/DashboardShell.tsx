'use client';

import type { ReactNode } from 'react';

type Props = {
  nav: ReactNode;
  children: ReactNode;
  /** whether the sidebar is visible */
  open: boolean;
};

export default function DashboardShell({ nav, children, open }: Props) {
  return (
    <div
      className="grid min-h-[70vh]"
      // Smoothly animate the sidebar width
      style={{ gridTemplateColumns: open ? '220px 1fr' : '0 1fr', transition: 'grid-template-columns .2s ease' }}
    >
      {/* Sidebar column */}
      <aside
        aria-hidden={!open}
        aria-label="App menu"
        // Important: no horizontal overflow, keep vertical scroll
        className={[
          'box-border border-r border-neutral-200 bg-white',
          open ? 'px-4 py-4 opacity-100 pointer-events-auto' : 'p-0 opacity-0 pointer-events-none',
          'overflow-x-hidden overflow-y-auto',
          'transition-[opacity,padding] duration-200 ease-linear',
        ].join(' ')}
        // When closed, keep it out of tab order
        tabIndex={open ? 0 : -1}
      >
        {nav}
      </aside>

      {/* Main content */}
      <section className="relative p-6">
        {children}
      </section>
    </div>
  );
}
