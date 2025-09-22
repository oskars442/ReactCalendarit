// src/lib/eventIcons.ts

export type UiKind = "work" | "recurring-monthly" | "recurring-yearly" | "todo";

export const kindIcon: Record<UiKind, string> = {
  "work": "💼",
  "recurring-monthly": "📅",
  "recurring-yearly": "🎉",
  "todo": "✅",
};
