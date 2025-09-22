import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== "ADMIN") {
    // fallback to default locale login
    redirect("/lv/login");
  }

  return <div style={{ padding: 24, border: "2px dashed #ddd" }}>{children}</div>;
}
