// Root layout required by the Next.js App Router
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: "Calendarit",
  description: "All-in-one life hub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}