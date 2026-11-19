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
  "hero": {
    "badge": "THE VIRTUAL ITEMS STORE",
    "title": "Rides, frames, badges and entrances that",
    "highlight": "stand out.",
    "subtitle": "Ride in style, frame your profile, dress up your avatar and decorate your room with BGs, seats, chat boxes and cards. Everything you need to shine in every room.",
    "primaryLabel": "Shop all items",
    "primaryHref": "/shop",
    "secondaryLabel": "Browse categories",
    "secondaryHref": "#categories",
    "points": [
      "Instant delivery",
      "Works in every room",
      "Exclusive designs"
    ],
    "image": "/products/nova-ui-kit.png",
    "statValue": 12000,
    "statSuffix": "+",
    "statLabel": "happy users"
  },
  "clients": {
    "enabled": true,
    "items": [
      {
        "name": "Lumen",
        "logo": "/clients/lumen.svg"
      },
      {
        "name": "Orbit",
        "logo": "/clients/orbit.svg"
      },
      {
        "name": "Kinetic",
        "logo": "/clients/kinetic.svg"
      },
      {
        "name": "Vertex",
        "logo": "/clients/vertex.svg"
      },
      {
        "name": "Halo",
        "logo": "/clients/halo.svg"
      },
      {
        "name": "Pulse",
        "logo": "/clients/pulse.svg"
      },
      {
        "name": "Nimbus",
        "logo": "/clients/nimbus.svg"
      },
      {
        "name": "Zenith",
        "logo": "/clients/zenith.svg"
      }
    ]
  },
  "categories": {
    "title": "Shop by category"
  },
  "trending": {
    "title": "Trending items this week"
  },
  "promo": {
    "enabled": true,
    "tag": "−25%",
    "title": "Upgrade your whole look for less",
    "text": "Save 25% on ride, frame and entrance bundles this week.",
    "buttonLabel": "Shop bundles",
    "buttonHref": "/shop"
  },
  "howItWorks": {
    "eyebrow": "HOW IT WORKS",
    "title": "From the store to your profile in minutes",
    "steps": [
      {
        "title": "Pick your items",
        "text": "Browse rides, frames, dress-ups, badges, room BGs and more. Animated and static styles for every taste."
      },
      {
        "title": "Check out securely",
        "text": "Pay with card, Apple Pay or Google Pay through Stripe in a few seconds."
      },
      {
        "title": "Equip and show off",
        "text": "Items land in your inventory right away. Equip them anytime and everyone in the room will see them."
      }
    ]
  },
  "testimonials": {
    "enabled": true,
    "title": "Loved by hosts and players",
    "items": [
      {
        "quote": "My Dragon Entrance gets a reaction every single time I join a room. Worth every coin.",
        "name": "Alex Morgan",
        "role": "Top host"
      },
      {
        "quote": "The frames and profile BGs look amazing and they showed up in my inventory instantly.",
        "name": "Jordan Reed",
        "role": "VIP member"
      },
      {
        "quote": "I decorated my whole room with the Night City BG and Crystal Room Frame. My guests love it.",
        "name": "Sam Kim",
        "role": "Room owner"
      }
    ]
  },
  "newsletter": {
    "title": "New drops, first",
    "text": "Get notified about new rides, frames, entrances and limited-time bundles before anyone else."
  }
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
