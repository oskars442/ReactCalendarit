'use client';
import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Tools = {
  calendar:boolean; diary:boolean; tasks:boolean; workouts:boolean;
  shopping:boolean; weather:boolean; baby:boolean; stats:boolean; projects:boolean;
};

const LABELS: Record<keyof Tools, string> = {
  calendar:"Kalendārs", diary:"Darba dienasgrāmata", tasks:"Uzdevumi", workouts:"Treniņi",
  shopping:"Iepirkumi", weather:"Laikapstākļi", baby:"Mazuļa izsekošana",
  stats:"Statistika (Premium)", projects:"Projekti",
};

export default function ToolsClient({ initial }: { initial: Tools }) {
  const [state, setState] = useState<Tools>(initial);
  const [isPending, start] = useTransition();

  const toggle = (key: keyof Tools) => {
    const next = { ...state, [key]: !state[key] };
    setState(next); // optimistiski
    start(async () => {
      const res = await fetch("/api/user/tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!res.ok) {
        setState(state); // atgriežam, ja kļūda
        toast.error("Neizdevās saglabāt.");
      } else {
        toast.success("Saglabāts.");
      }
    });
  };

  return (
    <section className="max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rīki</h1>
      <p className="text-sm text-muted-foreground">Ieslēdz/izslēdz moduļus, ko vēlies redzēt sānjoslā un lietot.</p>
      <div className="divide-y rounded-lg border">
        {(Object.keys(LABELS) as (keyof Tools)[]).map((k) => (
          <div key={k} className="flex items-center justify-between p-4">
            <Label htmlFor={`sw-${k}`}>{LABELS[k]}</Label>
            <Switch id={`sw-${k}`} checked={state[k]} onCheckedChange={() => toggle(k)} disabled={isPending}/>
          </div>
        ))}
      </div>
    </section>
  );
}
