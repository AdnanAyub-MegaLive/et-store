import { z } from "zod";
import { ABOUT_ICONS } from "@/lib/about-content-schema";

/** Shape + defaults of the editable Contact page (admin → Contact page). Safe to import on client and server. */

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => z.string().trim().min(1, "This field is required").max(max);
/** Site path, https link or mailto: link. */
const link = z
  .string()
  .trim()
  .max(300)
  .regex(/^(\/[\w\-./?=&#%]*|https:\/\/[\w\-./%?=&#:]+|mailto:[^\s<>"]+)$/, "Links must start with /, https:// or mailto:");

export const CONTACT_ICONS = [...ABOUT_ICONS, "mail", "clock", "help", "phone", "map", "chat"] as const;

export const contactContentSchema = z.object({
  hero: z.object({ eyebrow: text(40), title: required(120), highlight: text(60), intro: text(500) }),
  form: z.object({
    title: required(80),
    topics: z.array(required(60)).min(1, "Add at least one topic").max(12),
    successText: required(240),
  }),
  cards: z
    .array(
      z.object({
        icon: z.enum(CONTACT_ICONS),
        title: required(60),
        text: text(240),
        linkLabel: text(80),
        linkHref: link.or(z.literal("")),
      }),
    )
    .max(6),
});

export type ContactContent = z.infer<typeof contactContentSchema>;

export const CONTACT_DEFAULTS: ContactContent = {
  hero: {
    eyebrow: "GET IN TOUCH",
    title: "We'd love to",
    highlight: "hear from you.",
    intro: "Questions about an order, a licence, or selling on ET-Store? Send us a message.",
  },
  form: {
    title: "Send a message",
    topics: ["General question", "Order or download", "Refund request", "Licensing", "Become a creator", "Other"],
    successText: "Thanks! Your message is on its way. We usually reply within 1 business day.",
  },
  cards: [
    { icon: "mail", title: "Email us", text: "", linkLabel: "support@et-store.example", linkHref: "mailto:support@et-store.example" },
    { icon: "clock", title: "Response time", text: "We reply within 1 business day.", linkLabel: "", linkHref: "" },
    { icon: "help", title: "Quick answers", text: "Most questions are answered in our", linkLabel: "Help Center", linkHref: "/help" },
  ],
};

export function contactWithDefaults(raw: unknown): ContactContent {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    hero: { ...CONTACT_DEFAULTS.hero, ...((obj.hero as object) ?? {}) },
    form: { ...CONTACT_DEFAULTS.form, ...((obj.form as object) ?? {}) },
    cards: Array.isArray(obj.cards) ? obj.cards : CONTACT_DEFAULTS.cards,
  };
  const parsed = contactContentSchema.safeParse(merged);
  return parsed.success ? parsed.data : CONTACT_DEFAULTS;
}
