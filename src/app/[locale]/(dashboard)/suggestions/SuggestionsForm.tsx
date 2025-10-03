// src/app/[locale]/(dashboard)/suggestions/SuggestionsForm.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSWRConfig } from "swr";

type Issues = {
  name?: { _errors?: string[] };
  email?: { _errors?: string[] };
  content?: { _errors?: string[] };
  [k: string]: any;
};

const MIN_LEN = 10;
const MAX_LEN = 2000;

export default function SuggestionsForm() {
  const t = useTranslations("suggestions.form");
  const { mutate } = useSWRConfig(); 

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [anon, setAnon] = useState(false);
  const [hide, setHide] = useState(false);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ name?: string; email?: string; content?: string }>({});
  const abortRef = useRef<AbortController | null>(null);

  const remaining = useMemo(() => Math.max(0, MIN_LEN - content.trim().length), [content]);

  function resetErrors() {
    setErr(null);
    setFieldErr({});
  }

  function validateClient(): boolean {
    resetErrors();

    // optional email format check
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErr((e) => ({ ...e, email: t("emailInvalid", { default: "Nederīgs e-pasts" }) }));
      return false;
    }

    if (content.trim().length < MIN_LEN) {
      setFieldErr((e) => ({
        ...e,
        content:
          t("tooShort", { default: "Ieteikums ir par īsu (min. {min} rakstzīmes)", min: MIN_LEN }) ||
          `Ieteikums ir par īsu (min. ${MIN_LEN})`,
      }));
      return false;
    }
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateClient()) return;

    setLoading(true);
    setOk(null);
    setErr(null);
    setFieldErr({});

    // anti-spam honeypot (slēpts lauks; ja aizpildīts — nepiegādāsim)
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value;
    if (honeypot) {
      setLoading(false);
      setErr(t("err"));
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const payload = {
      name: anon ? undefined : name || undefined,
      email: anon ? undefined : email || undefined,
      isAnonymous: anon,
      hidePublic: hide,
      content,
    };

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abortRef.current.signal,
    });

    if (res.ok) {
      setOk(t("ok"));
      setName("");
      setEmail("");
      setAnon(false);
      setHide(false);
      setContent("");
      (e.target as HTMLFormElement).reset();
      await mutate("/api/suggestions"); 
    } else {
      const data: { error?: string; issues?: Issues } = await res.json().catch(() => ({} as any));

      const issues = data?.issues;
      if (issues) {
        const fe: typeof fieldErr = {};
        if (issues.name?._errors?.[0]) fe.name = issues.name._errors[0];
        if (issues.email?._errors?.[0]) fe.email = issues.email._errors[0];
        if (issues.content?._errors?.[0]) fe.content = issues.content._errors[0];
        setFieldErr(fe);
      }

      setErr(data?.error || t("err"));
    }

    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ✅ {t("hintLine", { default: "Ziņo par kļūdām · Iesaki uzlabojumus · Dalies ar idejām" })}
      </p>

      {/* Honeypot (nerediģē lietotājam) */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {/* Name */}
      <div>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          className={`w-full rounded-lg border px-3 py-2 ${fieldErr.name ? "border-rose-400" : ""}`}
          aria-invalid={!!fieldErr.name}
          aria-describedby={fieldErr.name ? "name-error" : undefined}
        />
        {fieldErr.name && (
          <div id="name-error" className="mt-1 text-xs text-rose-600">
            {fieldErr.name}
          </div>
        )}
      </div>

      {/* Email */}
      <div>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email")}
          className={`w-full rounded-lg border px-3 py-2 ${fieldErr.email ? "border-rose-400" : ""}`}
          aria-invalid={!!fieldErr.email}
          aria-describedby={fieldErr.email ? "email-error" : undefined}
        />
        {fieldErr.email && (
          <div id="email-error" className="mt-1 text-xs text-rose-600">
            {fieldErr.email}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="anon"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            className="size-4"
          />
          {t("anon")}
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="hide"
            checked={hide}
            onChange={(e) => setHide(e.target.checked)}
            className="size-4"
          />
          {t("hide")}
        </label>
      </div>

      {/* Content */}
      <div>
        <textarea
          name="content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
          placeholder={`✍️ ${t("content")}`}
          rows={6}
          className={`w-full rounded-lg border px-3 py-2 ${fieldErr.content ? "border-rose-400" : ""}`}
          aria-invalid={!!fieldErr.content}
          aria-describedby="content-hint"
        />
        <div id="content-hint" className="mt-1 text-xs text-muted-foreground">
          {content.trim().length}/{MAX_LEN}
          {content.trim().length < MIN_LEN && (
            <span className="ml-2 text-rose-600">
              · {MIN_LEN - content.trim().length} {t("charsToMin", { default: "līdz minimumam" })}
            </span>
          )}
        </div>
        {fieldErr.content && (
          <div className="mt-1 text-xs text-rose-600">{fieldErr.content}</div>
        )}
      </div>

      {/* Submit */}
      <button
        disabled={loading || content.trim().length < MIN_LEN}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "…" : t("submit")}
      </button>

      {/* Messages */}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
      {err && <div className="text-red-600 text-sm">{err}</div>}
    </form>
  );
}
