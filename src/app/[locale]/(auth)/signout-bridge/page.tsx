// src/app/[locale]/(auth)/signout-bridge/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function SignoutBridgePage() {
  const params = useParams<{ locale: 'lv' | 'en' | 'ru' }>();

  useEffect(() => {
    // Klusā izrakstīšanās un redirect uz publisko sākumlapu
    signOut({
      callbackUrl: `/${params.locale}`,
      redirect: true,
    });
  }, [params.locale]);

  return (
    <div className="min-h-dvh grid place-items-center">
      <div className="rounded-xl border p-6 text-center text-sm text-neutral-600">
        Izrakstīšanās…
      </div>
    </div>
  );
}
