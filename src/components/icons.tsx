import { BookOpen, Briefcase, LayoutTemplate, Palette, Shapes, Sparkles, type LucideIcon } from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  "layout-template": LayoutTemplate,
  shapes: Shapes,
  "book-open": BookOpen,
  palette: Palette,
  sparkles: Sparkles,
  briefcase: Briefcase,
};

/** Each category gets its own accent colour (icon tile gradient + soft tint). */
export const categoryAccent: Record<string, { tile: string; tint: string; text: string }> = {
  templates: { tile: "from-violet-500 to-indigo-500", tint: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-300" },
  "ui-kits": { tile: "from-fuchsia-500 to-pink-500", tint: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-600 dark:text-pink-300" },
  "ebooks-guides": { tile: "from-amber-400 to-orange-500", tint: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-300" },
  graphics: { tile: "from-cyan-400 to-sky-500", tint: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-300" },
  "ai-prompts": { tile: "from-emerald-400 to-teal-500", tint: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300" },
  "business-tools": { tile: "from-rose-500 to-red-500", tint: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-300" },
};
export const accentFor = (slug: string) => categoryAccent[slug] ?? categoryAccent.templates;
