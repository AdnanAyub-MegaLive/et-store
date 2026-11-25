import { z } from "zod";

/** Shape + defaults of the editable About page (admin → About page). Safe to import on client and server. */

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => z.string().trim().min(1, "This field is required").max(max);
const link = z
  .string()
  .trim()
  .max(300)
  .regex(/^(\/[\w\-./?=&#%]*|#[\w-]+|https:\/\/[\w\-./%?=&#:]+)$/, "Links must start with /, # or https://");

export const ABOUT_ICONS = ["badge", "heart", "sparkles", "users", "star", "shield", "zap", "gift"] as const;
export const STAT_SOURCES = ["custom", "products", "categories"] as const;

export const aboutContentSchema = z.object({
  hero: z.object({ eyebrow: text(40), title: required(120), highlight: text(60), intro: text(500) }),
  stats: z.object({
    enabled: z.boolean(),
    items: z
      .array(
        z.object({
          source: z.enum(STAT_SOURCES),
          value: z.coerce.number().min(0).max(100_000_000),
          suffix: text(5),
          label: required(40),
        }),
      )
      .max(4),
  }),
  story: z.object({
    enabled: z.boolean(),
    title: required(80),
    paragraphs: z.array(text(1000)).max(4),
    quote: text(300),
    quoteBy: text(60),
  }),
  values: z.object({
    enabled: z.boolean(),
    title: required(80),
    items: z.array(z.object({ icon: z.enum(ABOUT_ICONS), title: required(60), text: text(240) })).max(8),
  }),
  cta: z.object({
    enabled: z.boolean(),
    title: required(80),
    text: text(240),
    primaryLabel: text(40),
    primaryHref: link.or(z.literal("")),
    secondaryLabel: text(40),
    secondaryHref: link.or(z.literal("")),
  }),
});

export type AboutContent = z.infer<typeof aboutContentSchema>;

export const ABOUT_DEFAULTS: AboutContent = {
  hero: {
    eyebrow: "OUR STORY",
    title: "Tools that help good work",
    highlight: "stand out.",
    intro:
      "ET-Store started with a simple frustration: finding a great template took longer than using it. So we built a small, carefully edited marketplace where every product earns its place.",
  },
  stats: {
    enabled: true,
    items: [
      { source: "custom", value: 12000, suffix: "+", label: "Creators" },
      { source: "products", value: 0, suffix: "", label: "Curated products" },
      { source: "categories", value: 0, suffix: "", label: "Categories" },
      { source: "custom", value: 4.8, suffix: "", label: "Average rating" },
    ],
  },
  story: {
    enabled: true,
    title: "Why we exist",
    paragraphs: [
      "Independent designers, writers and founders make some of the best work on the internet, but it often gets buried in marketplaces built for volume. We wanted the opposite: a place where quality is the filter and every listing is something we would buy ourselves.",
      "Today ET-Store brings together templates, UI kits, guides, graphics, AI prompts and business tools from makers around the world, with simple licensing and instant access after checkout.",
    ],
    quote: "Our job is to save you the hours of searching, so you can spend them on the work only you can do.",
    quoteBy: "The ET-Store team",
  },
  values: {
    enabled: true,
    title: "What we care about",
    items: [
      { icon: "badge", title: "Curated, not crowded", text: "Every product is reviewed by a person before it goes live. Fewer choices, all of them good." },
      { icon: "heart", title: "Fair to creators", text: "Makers keep the majority of every sale and get paid out on a predictable schedule." },
      { icon: "sparkles", title: "Built to be used", text: "Clear licences, instant downloads and lifetime updates, so buying is the easy part." },
      { icon: "users", title: "Made with the community", text: "Our roadmap comes from the buyers and makers who use ET-Store every day." },
    ],
  },
  cta: {
    enabled: true,
    title: "Find your next favourite tool",
    text: "Browse the full collection, or get in touch if you'd like to sell your work on ET-Store.",
    primaryLabel: "Explore products",
    primaryHref: "/shop",
    secondaryLabel: "Contact us",
    secondaryHref: "/contact",
  },
};

/** Merge stored content over the defaults (section by section) so new fields never break old rows. */
export function aboutWithDefaults(raw: unknown): AboutContent {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = Object.fromEntries(
    Object.entries(ABOUT_DEFAULTS).map(([k, def]) => [k, { ...def, ...((obj[k] as object) ?? {}) }]),
  );
  const parsed = aboutContentSchema.safeParse(merged);
  return parsed.success ? parsed.data : ABOUT_DEFAULTS;
}
