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

/** Each category gets its own accent colour (icon tile gradient + soft tint). */
export const categoryAccent: Record<string, { tile: string; tint: string; text: string }> = {
  ride: { tile: "from-violet-500 to-indigo-500", tint: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-300" },
  frame: { tile: "from-fuchsia-500 to-pink-500", tint: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-600 dark:text-pink-300" },
  "dress-up": { tile: "from-amber-400 to-orange-500", tint: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-300" },
  "profile-bg": { tile: "from-cyan-400 to-sky-500", tint: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-300" },
  seats: { tile: "from-emerald-400 to-teal-500", tint: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300" },
  entrance: { tile: "from-rose-500 to-red-500", tint: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-300" },
  badge: { tile: "from-yellow-400 to-amber-500", tint: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-300" },
  "chat-box": { tile: "from-sky-400 to-blue-600", tint: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-600 dark:text-sky-300" },
  "room-bg": { tile: "from-purple-500 to-fuchsia-600", tint: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-300" },
  "room-frames": { tile: "from-lime-400 to-green-500", tint: "bg-lime-50 dark:bg-lime-500/10", text: "text-lime-600 dark:text-lime-300" },
  card: { tile: "from-pink-500 to-orange-400", tint: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-300" },
};
export const accentFor = (slug: string) => categoryAccent[slug] ?? categoryAccent.ride;
