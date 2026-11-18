import { z } from "zod";

/** Shape + defaults of the editable home page content (admin → Home page). Safe to import on client and server. */

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => z.string().trim().min(1, "This field is required").max(max);
/** Site path ("/shop", "#categories") or https link. */
const link = z
  .string()
  .trim()
  .max(300)
  .regex(/^(\/[\w\-./?=&#%]*|#[\w-]+|https:\/\/[\w\-./%?=&#:]+)$/, "Links must start with /, # or https://");
/** Image path (/uploads/..., /products/...) or https link. */
const image = z.string().trim().max(500).regex(/^(\/[\w\-./]+|https:\/\/[\w\-./%?=&]+)$/, "Image must be a /path or https URL");

export const homeContentSchema = z.object({
  hero: z.object({
    badge: text(60),
    title: required(120),
    highlight: text(60),
    subtitle: text(300),
    primaryLabel: required(40),
    primaryHref: link,
    secondaryLabel: text(40),
    secondaryHref: link.or(z.literal("")),
    points: z.array(text(60)).max(3),
    image,
    statValue: z.coerce.number().int().min(0).max(100_000_000),
    statSuffix: text(5),
    statLabel: text(40),
  }),
  clients: z.object({
    enabled: z.boolean(),
    items: z.array(z.object({ name: required(60), logo: image })).max(20),
  }),
  categories: z.object({ title: required(80) }),
  trending: z.object({ title: required(80) }),
  promo: z.object({
    enabled: z.boolean(),
    tag: text(12),
    title: required(100),
    text: text(200),
    buttonLabel: required(40),
    buttonHref: link,
  }),
  howItWorks: z.object({
    eyebrow: text(40),
    title: required(100),
    steps: z.array(z.object({ title: required(60), text: text(200) })).length(3),
  }),
  testimonials: z.object({
    enabled: z.boolean(),
    title: required(80),
    items: z.array(z.object({ quote: required(400), name: required(60), role: text(60) })).max(6),
  }),
  newsletter: z.object({ title: required(80), text: text(200) }),
});

export type HomeContent = z.infer<typeof homeContentSchema>;

export const HOME_DEFAULTS: HomeContent = {
  hero: {
    badge: "THE VIRTUAL ITEMS STORE",
    title: "Rides, frames and entrances that",
    highlight: "stand out.",
    subtitle: "Style your profile and rooms with rides, frames, badges, chat boxes and more. Make every entrance one to remember.",
    primaryLabel: "Explore products",
    primaryHref: "/shop",
    secondaryLabel: "Browse categories",
    secondaryHref: "#categories",
    points: ["Instant delivery", "Works in every room", "Exclusive designs"],
    image: "/products/nova-ui-kit.png",
    statValue: 12000,
    statSuffix: "+",
    statLabel: "happy users",
  },
  clients: {
    enabled: true,
    items: ["Lumen", "Orbit", "Kinetic", "Vertex", "Halo", "Pulse", "Nimbus", "Zenith"].map((name) => ({ name, logo: `/clients/${name.toLowerCase()}.svg` })),
  },
  categories: { title: "Shop by category" },
  trending: { title: "Trending this week" },
  promo: {
    enabled: true,
    tag: "−25%",
    title: "Build your next big thing for less",
    text: "Save 25% on curated bundles this week.",
    buttonLabel: "Shop bundles",
    buttonHref: "/shop",
  },
  howItWorks: {
    eyebrow: "HOW IT WORKS",
    title: "From idea to download in minutes",
    steps: [
      { title: "Browse curated tools", text: "Every product is reviewed for quality, so you only see work worth buying." },
      { title: "Check out securely", text: "Pay with card, Apple Pay or Google Pay through Stripe in a few seconds." },
      { title: "Download instantly", text: "Files land in your library right away, with free lifetime updates." },
    ],
  },
  testimonials: {
    enabled: true,
    title: "Loved by independent makers",
    items: [
      { quote: "ET-Store has become my go-to place for polished assets that make every client project feel more considered.", name: "Alex Morgan", role: "Brand designer" },
      { quote: "The quality is exceptional and the instant downloads keep my small team moving without slowing down.", name: "Jordan Reed", role: "Founder, Northstar" },
      { quote: "I find something useful every time I visit. It feels like a carefully edited library, not another noisy marketplace.", name: "Sam Kim", role: "Creative consultant" },
    ],
  },
  newsletter: {
    title: "Fresh assets, zero noise",
    text: "A thoughtful digest of new digital products, practical resources, and marketplace news.",
  },
};

/** Fill any missing section from the defaults (e.g. content saved before a new field existed). */
export function withDefaults(raw: unknown): HomeContent {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = Object.fromEntries(
    Object.entries(HOME_DEFAULTS).map(([k, def]) => [k, { ...def, ...((obj[k] as object) ?? {}) }]),
  );
  const parsed = homeContentSchema.safeParse(merged);
  return parsed.success ? parsed.data : HOME_DEFAULTS;
}
