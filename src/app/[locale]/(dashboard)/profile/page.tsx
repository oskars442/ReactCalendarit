// src/app/[locale]/(dashboard)/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

/* ───────────────────────── i18n helpers ───────────────────────── */

type Locale = "lv" | "en" | "ru";
const LOCALES: readonly Locale[] = ["lv", "en", "ru"] as const;

async function loadMessages(loc: Locale) {
  // vienkārša dinamiskā ielāde no /lib/i18n/messages
  const mod = await import(`@/lib/i18n/messages/${loc}.json`);
  return mod.default as Record<string, any>;
}

// droši paņem locale no referera (server actions)
function getLocaleFromRef(ref: string | null): Locale {
  if (!ref) return "lv";
  try {
    const seg = new URL(ref).pathname.split("/")[1];
    return LOCALES.includes(seg as Locale) ? (seg as Locale) : "lv";
  } catch {
    return "lv";
  }
}

// “mini translator”: ņem vērtību pēc ceļa "profile.x.y"
function pick(obj: any, path: string, fallback?: string) {
  return path.split(".").reduce((acc: any, key) => (acc?.[key] ?? undefined), obj) ?? fallback ?? path;
}

/* ───────────── pieejamie moduļi (tikai atslēgas!) ───────────── */

const MODULE_KEYS = [
  "calendar",
  "diary",
  "tasks",
  "workouts",
  "shopping",
  "weather",
  "baby",
  "stats",
  "projects",
] as const;
type ToolKey = typeof MODULE_KEYS[number];
type Tools = Record<ToolKey, boolean>;

/* ───────────────────────── server actions ───────────────────────── */

async function saveTools(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const id = Number((session?.user as any)?.id);
  if (!id) redirect("/login");

  const patch: Partial<Tools> = {};
  for (const key of MODULE_KEYS) {
    (patch as any)[key] = formData.get(`tools.${key}`) === "on";
  }

  await prisma.userToolSettings.upsert({
    where: { userId: id },
    update: patch,
    create: { userId: id, ...(patch as Tools) },
  });

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

  if (next.length < 8) throw new Error("profile.errors.passwordMin");
  if (next !== confirm) throw new Error("profile.errors.passwordMismatch");

  const user = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
  if (!user) redirect("/login");

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) throw new Error("profile.errors.passwordWrong");

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
    throw new Error("profile.delete.confirmError");
  }

  await prisma.user.delete({ where: { id } });

  const locale = getLocaleFromRef((await headers()).get("referer"));
  redirect(`/${locale}/signout-bridge`);
}

/* ───────────────────────────── Page (Server) ───────────────────────────── */

export default async function ProfilePage(props: {
  params: Promise<{ locale: Locale }> | { locale: Locale };
}) {
  // locale no din. maršruta
  const resolved = await Promise.resolve(props.params);
  const locale = LOCALES.includes(resolved.locale) ? resolved.locale : "lv";
  const messages = await loadMessages(locale);
  const t = (k: string, fb?: string) => pick(messages, `profile.${k}`, fb);

  const session = await getServerSession(authOptions);
  const id = Number((session?.user as any)?.id);
  if (!id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, firstName: true, lastName: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const settings = await prisma.userToolSettings.upsert({
    where: { userId: id },
    update: {},
    create: { userId: id },
    select: {
      calendar: true, diary: true, tasks: true, workouts: true,
      shopping: true, weather: true, baby: true, stats: true, projects: true,
    },
  });

  // kartējam locale uz “reālu” BCP47 tagu datuma formatam
  const dateLocale = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "lv-LV";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-neutral-500">
          {user.firstName || user.lastName
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            : user.email}
        </p>
      </header>

      {/* Tools */}
      <section className="rounded-2xl border border-neutral-200/60 p-5 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60">
        <h2 className="text-lg font-medium mb-3">{t("tools.title")}</h2>
        <p className="text-sm text-neutral-500 mb-4">{t("tools.hint")}</p>

        <form action={saveTools} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULE_KEYS.map((key) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-xl border border-neutral-200/60 p-3 dark:border-neutral-800/70"
              >
                <input
                  type="checkbox"
                  name={`tools.${key}`}
                  defaultChecked={(settings as any)[key] as boolean}
                  className="h-5 w-5 accent-emerald-600"
                />
                <span className="text-sm">{t(`tools.items.${key}`)}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              {t("actions.save")}
            </button>
          </div>
        </form>
      </section>

      {/* Change password */}
      <section className="rounded-2xl border border-neutral-200/60 p-5 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60">
        <h2 className="text-lg font-medium mb-3">{t("password.title")}</h2>
        <p className="text-sm text-neutral-500 mb-4">{t("password.hint")}</p>

        <form action={changePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm">{t("password.current")}</label>
            <input
              type="password"
              name="current"
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">{t("password.new")}</label>
            <input
              type="password"
              name="next"
              minLength={8}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">{t("password.confirm")}</label>
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
              {t("actions.changePassword")}
            </button>
          </div>
        </form>
      </section>

      {/* Delete account */}
      <section className="rounded-2xl border border-rose-300/60 p-5 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800/70">
        <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-300">
          {t("delete.title")}
        </h2>
        <p className="text-sm text-rose-700/80 dark:text-rose-300/80 mt-1">
          {t("delete.warning")}
        </p>

        <form action={deleteAccount} className="mt-4 space-y-3 max-w-md">
          <label className="text-sm">{t("delete.confirmLabel")}</label>
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
            {t("delete.action")}
          </button>
        </form>
      </section>

      {/* Info */}
      <section className="text-xs text-neutral-500">
        {t("createdAtPrefix")}{" "}
        {new Date(user.createdAt).toLocaleString(dateLocale, {
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
