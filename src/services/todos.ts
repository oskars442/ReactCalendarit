// src/services/todos.ts
import type { ISODate } from "@/lib/types";

type Priority = "low" | "med" | "high";

export async function create(input: {
  title: string;
  due: ISODate;
  priority?: Priority;
  note?: string | null;
}): Promise<void> {
  const res = await fetch("/api/todo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      priority: input.priority ?? "med",
      due: input.due,
      note: input.note ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to create todo");
    window.dispatchEvent(new CustomEvent("calendarit:todosChanged", { detail: { date: input.due } }));
  return res.json();
  }
  // optional: emit a sync event (you already dispatch from DayDialog too)
  window.dispatchEvent(new Event("calendarit:todosChanged"));
}
