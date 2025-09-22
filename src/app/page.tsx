// src/app/page.tsx
import { redirect } from 'next/navigation';

// change 'en' to whatever your default is: 'lv', 'ru', etc.
export default function RootRedirect() {
  redirect('/lv');
}
