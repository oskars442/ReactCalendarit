//src/components/day/AmountInput.tsx  For Daily event log

"use client";
import { useEffect, useState } from "react";

function toCents(input: string): number | undefined {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return undefined;
  const num = Number(normalized);
  if (Number.isNaN(num)) return undefined;
  return Math.round(num * 100);
}
function fromCents(cents?: number): string {
  if (cents == null) return "";
  return (cents / 100).toString();
}

export default function AmountInput(props: {
  label: string;
  placeholder?: string;
  valueCents?: number;
  onChangeCents: (cents?: number) => void;
  note?: string;
  onChangeNote?: (v: string) => void;
  "aria-label"?: string;
}) {
  const { label, placeholder, valueCents, onChangeCents, note, onChangeNote } = props;
  const [val, setVal] = useState(fromCents(valueCents));
  useEffect(() => setVal(fromCents(valueCents)), [valueCents]);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white/70 dark:bg-neutral-900/70 shadow-sm">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 text-sm">€</span>
        <input
          aria-label={props["aria-label"]}
          inputMode="decimal"
          className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={val}
          onChange={(e) => {
            const s = e.target.value;
            setVal(s);
            onChangeCents(toCents(s));
          }}
        />
      </div>
      {onChangeNote && (
        <input
          aria-label={`${props["aria-label"]}-note`}
          className="mt-3 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What was this for?"
          value={note ?? ""}
          onChange={(e) => onChangeNote(e.target.value)}
        />
      )}
    </div>
  );
}
