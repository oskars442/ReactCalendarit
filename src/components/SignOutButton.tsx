"use client";

import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = { className?: string };

export default function SignOutButton({ className = "" }: Props) {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();
  const seg = pathname?.split("/")[1];
  const locale = seg === "lv" || seg === "en" || seg === "ru" ? seg : "lv";

  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false });
        router.replace(`/${locale}/login`);
        router.refresh();
      }}
      aria-label={t("logout")}
      className={[
        "block w-full rounded-xl px-4 py-2 text-sm font-semibold text-white",
        "bg-rose-500 hover:bg-rose-600 active:bg-rose-700",
        "transition-colors",
        // draw focus ring inward; no external shadow that could trigger overflow
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        className,
      ].join(" ")}
    >
      {t("logout")}
    </button>
  );
}
