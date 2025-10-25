// src/app/[locale]/(dashboard)/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

/* ───────────────────────────────── helpers ───────────────────────────────── */

type Locale = "lv" | "en" | "ru";
const LOCALES: readonly Locale[] = ["lv", "en", "ru"] as const;

function getLocaleFromRef(ref: string | null): Locale {
  if (!ref) return "lv";
  try {
    const seg = new URL(ref).pathname.split("/")[1];
    return LOCALES.includes(seg as Locale) ? (seg as Locale) : "lv";
  } catch {
    return "lv";
  }
}

/* ───────────────────────────── pieejamie moduļi ─────────────────────────── */

const MODULES = [
  { key: "calendar",  label: "Kalendārs" },
  { key: "diary",     label: "Darba dienasgrāmata" },
  { key: "tasks",     label: "Uzdevumi" },
  { key: "workouts",  label: "Treniņi" },
  { key: "shopping",  label: "Iepirkumi" },
  { key: "weather",   label: "Laikapstākļi" },
  { key: "baby",      label: "Mazuļa izsekošana" },
  { key: "stats",     label: "Statistika (Premium)" },
  { key: "projects",  label: "Projekti" },
] as const;

type ToolKey = (typeof MODULES)[number]["key"];
type Tools = Record<ToolKey, boolean>;

/* ───────────────────────── server actions ───────────────────────── */

async function saveTools(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const id = Number((session?.user as any)?.id);
  if (!id) redirect("/login");

  // nolasām checkboxus
  const patch: Partial<Tools> = {};
  for (const { key } of MODULES) {
    const v = formData.get(`tools.${key}`);
    (patch as any)[key] = v === "on";
  }

  await prisma.userToolSettings.upsert({
    where: { userId: id },
    update: patch,
    create: { userId: id, ...(patch as Tools) },
  });

  // pārzīmē layout (lai Sidebar saņem jaunos tools) un atgriež uz profilu
  const locale = getLocaleFromRef((await headers()).get("referer"));
  revalidatePath(`/${locale}/(dashboard)`, "layout");
  redirect(`/${locale}/profile`);
}

async function changePassword(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const id = Number((session?.user as any)?.id);
  if (!id) redirect("/login");

  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (next.length < 8) throw new Error("Parolei jābūt vismaz 8 rakstzīmēm.");
  if (next !== confirm) throw new Error("Jaunā parole un apstiprinājums nesakrīt.");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true },
  });
  if (!user) redirect("/login");

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) throw new Error("Pašreizējā parole nav pareiza.");

  const newHash = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash: newHash } });
}

async function deleteAccount(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const id = Number((session?.user as any)?.id);
  if (!id) redirect("/login");

  const confirm = String(formData.get("confirm") || "");
  if (confirm !== "DELETE") {
    throw new Error('Lūdzu ieraksti "DELETE", lai apstiprinātu dzēšanu.');
  }

  // dzēšam lietotāju (saistītie dati tiks dzēsti atbilstoši relācijām)
  await prisma.user.delete({ where: { id } });

  // izrakstīšanās bez NextAuth dialoga — uz mūsu “tilta” lapu
  const locale = getLocaleFromRef((await headers()).get("referer"));
  redirect(`/${locale}/signout-bridge`);
}

/* ───────────────────────────── lapas renderis ───────────────────────────── */

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const id = Number((session?.user as any)?.id);
  if (!id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, firstName: true, lastName: true, createdAt: true },
  });
  if (!user) redirect("/login");

  // nodrošinām, ka iestatījumi vienmēr eksistē
  const settings = await prisma.userToolSettings.upsert({
    where: { userId: id },
    update: {},
    create: { userId: id },
    select: {
      calendar: true, diary: true, tasks: true, workouts: true,
      shopping: true, weather: true, baby: true, stats: true, projects: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mans profils</h1>
        <p className="text-sm text-neutral-500">
          {user.firstName || user.lastName
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            : user.email}
        </p>
      </header>

      {/* Rīki / moduļi */}
      <section className="rounded-2xl border border-neutral-200/60 p-5 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60">
        <h2 className="text-lg font-medium mb-3">Rīku iestatījumi</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Atzīmē, kuras sadaļas rādīt sānjoslā.
        </p>

        <form action={saveTools} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className="flex items-center gap-3 rounded-xl border border-neutral-200/60 p-3 dark:border-neutral-800/70"
              >
                <input
                  type="checkbox"
                  name={`tools.${m.key}`}
                  defaultChecked={(settings as any)[m.key] as boolean}
                  className="h-5 w-5 accent-emerald-600"
                />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Saglabāt
            </button>
          </div>
        </form>
      </section>

      {/* Paroles maiņa */}
      <section className="rounded-2xl border border-neutral-200/60 p-5 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60">
        <h2 className="text-lg font-medium mb-3">Paroles maiņa</h2>
        <p className="text-sm text-neutral-500 mb-4">Drošībai parolei jābūt vismaz 8 rakstzīmēm.</p>

        <form action={changePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm">Pašreizējā parole</label>
            <input
              type="password"
              name="current"
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">Jaunā parole</label>
            <input
              type="password"
              name="next"
              minLength={8}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">Apstiprini jauno paroli</label>
            <input
              type="password"
              name="confirm"
              minLength={8}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
            >
              Mainīt paroli
            </button>
          </div>
        </form>
      </section>

      {/* Konta dzēšana */}
      <section className="rounded-2xl border border-rose-300/60 p-5 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800/70">
        <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-300">Dzēst kontu</h2>
        <p className="text-sm text-rose-700/80 dark:text-rose-300/80 mt-1">
          Šī darbība ir neatgriezeniska. Tiks dzēsti visi ar profilu saistītie dati.
        </p>

        <form action={deleteAccount} className="mt-4 space-y-3 max-w-md">
          <label className="text-sm">
            Ievadi <b>DELETE</b>, lai apstiprinātu:
          </label>
          <input
            type="text"
            name="confirm"
            placeholder="DELETE"
            className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 dark:border-rose-800 dark:bg-neutral-950"
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
          >
            Dzēst kontu
          </button>
        </form>
      </section>

      {/* Info */}
      <section className="text-xs text-neutral-500">
        Konts izveidots:{" "}
        {new Date(user.createdAt).toLocaleString("lv-LV", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
        .
      </section>
    </div>
  );
}
