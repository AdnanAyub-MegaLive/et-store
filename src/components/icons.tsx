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
  Crown,
  Gem,
  Gift,
  Sparkles,
  Star,
  Music,
  Palette,
  Gamepad2,
  Heart,
  Zap,
  Smile,
  Rocket,
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
  crown: Crown,
  gem: Gem,
  gift: Gift,
  sparkles: Sparkles,
  star: Star,
  music: Music,
  palette: Palette,
  gamepad: Gamepad2,
  heart: Heart,
  zap: Zap,
  smile: Smile,
  rocket: Rocket,
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

