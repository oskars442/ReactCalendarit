"use client";

import {usePathname} from "next/navigation";

export default function PublicOffset({children}:{children:React.ReactNode}) {
  const pathname = usePathname() || "/";
  const isLanding = /^\/(lv|en|ru)\/?$/.test(pathname); // e.g. /lv, /en, /ru
  return <div className={isLanding ? "" : "pt-16"}>{children}</div>;
}
