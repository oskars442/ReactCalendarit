// src/app/admin/suggestions/page.tsx
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import CloseAdminButton from "../_components/CloseAdminButton"; // 👈

const STATUSES = ["NEW", "PLANNED", "IN_PROGRESS", "DONE", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

export default async function AdminSuggestions() {
  const session = await getSession();
  if (!isAdmin(session)) redirect("/");

  const items = await prisma.suggestion.findMany({
    where: { archived: false },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  async function setStatusAction(id: number, status: Status) {
    "use server";
    const s = await getSession();
    if (!isAdmin(s)) return;
    await prisma.suggestion.update({ where: { id }, data: { status } });
    revalidatePath("/admin/suggestions");
  }

  async function togglePinAction(id: number, pinned: boolean) {
    "use server";
    const s = await getSession();
    if (!isAdmin(s)) return;
    await prisma.suggestion.update({ where: { id }, data: { pinned } });
    revalidatePath("/admin/suggestions");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">⚙️ Suggestions (Admin)</h1>
        <CloseAdminButton /> {/* 👈 X poga */}
      </div>

      <div className="space-y-4">
        {items.map((i) => (
          <div key={i.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                #{i.id} · {new Date(i.createdAt).toLocaleString()}
              </div>

              <form action={togglePinAction.bind(null, i.id, !i.pinned)}>
                <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                  {i.pinned ? "Unpin" : "Pin"}
                </button>
              </form>
            </div>

            <p className="mt-2 whitespace-pre-wrap">{i.content}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {STATUSES.map((s) => (
                <form key={s} action={setStatusAction.bind(null, i.id, s)}>
                  <button
                    className={`rounded-full border px-3 py-1 text-xs ${
                      i.status === s ? "bg-black text-white" : "hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
