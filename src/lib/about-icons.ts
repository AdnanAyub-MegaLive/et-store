import { BadgeCheck, Gift, Heart, ShieldCheck, Sparkles, Star, Users, Zap, type LucideIcon } from "lucide-react";
import type { ABOUT_ICONS } from "@/lib/about-content-schema";

export const ABOUT_ICON_MAP: Record<(typeof ABOUT_ICONS)[number], LucideIcon> = {
  badge: BadgeCheck, heart: Heart, sparkles: Sparkles, users: Users, star: Star, shield: ShieldCheck, zap: Zap, gift: Gift,
};
export const ABOUT_COLORS = ["from-violet-500 to-indigo-500", "from-pink-500 to-rose-500", "from-amber-400 to-orange-500", "from-cyan-400 to-emerald-400"];
