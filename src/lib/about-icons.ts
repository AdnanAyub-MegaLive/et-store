import { BadgeCheck, Clock, Gift, Heart, LifeBuoy, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, Star, Users, Zap, type LucideIcon } from "lucide-react";
import type { CONTACT_ICONS } from "@/lib/contact-content-schema";

export const ABOUT_ICON_MAP: Record<(typeof CONTACT_ICONS)[number], LucideIcon> = {
  badge: BadgeCheck, heart: Heart, sparkles: Sparkles, users: Users, star: Star, shield: ShieldCheck, zap: Zap, gift: Gift,
  mail: Mail, clock: Clock, help: LifeBuoy, phone: Phone, map: MapPin, chat: MessageCircle,
};
export const ABOUT_COLORS = ["from-violet-500 to-indigo-500", "from-pink-500 to-rose-500", "from-amber-400 to-orange-500", "from-cyan-400 to-emerald-400"];
export const CONTACT_COLORS = ["from-violet-500 to-fuchsia-500", "from-cyan-400 to-sky-500", "from-amber-400 to-orange-500", "from-pink-500 to-rose-500"];
