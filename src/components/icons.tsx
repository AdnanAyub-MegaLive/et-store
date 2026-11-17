import {
  Armchair,
  Award,
  Car,
  CreditCard,
  DoorOpen,
  Frame,
  House,
  Image,
  MessageSquare,
  PanelsTopLeft,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  car: Car,
  frame: Frame,
  shirt: Shirt,
  image: Image,
  armchair: Armchair,
  "door-open": DoorOpen,
  award: Award,
  "message-square": MessageSquare,
  home: House,
  panels: PanelsTopLeft,
  "credit-card": CreditCard,
};
export const iconFor = (name: string) => categoryIcons[name] ?? Frame;

/** All categories share one accent colour; the icon tile switches colour on hover (inside a `group`). */
const ACCENT = {
  tile: "from-violet-500 to-indigo-500 group-hover:from-fuchsia-500 group-hover:to-pink-500",
  tint: "bg-violet-50 dark:bg-violet-500/10",
  text: "text-violet-600 dark:text-violet-300",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const accentFor = (slug: string) => ACCENT;

/** Display order for categories (header menu, home page). */
export const CATEGORY_ORDER = ["ride", "frame", "dress-up", "profile-bg", "seats", "entrance", "badge", "chat-box", "room-bg", "room-frames", "card"];
export const sortCategories = <T extends { slug: string }>(list: T[]) => {
  const rank = (slug: string) => CATEGORY_ORDER.indexOf(slug) + 1 || 99;
  return [...list].sort((a, b) => rank(a.slug) - rank(b.slug));
};
