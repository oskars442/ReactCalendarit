// Root layout required by the Next.js App Router
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Calendarit',
  // add other defaults if you like
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
