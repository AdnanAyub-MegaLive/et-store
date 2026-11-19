import { z } from "zod";

/** Shape + defaults of the editable site header (admin → Header). Safe to import on client and server. */

const text = (max: number) => z.string().trim().max(max);
const link = z
  .string()
  .trim()
  .max(300)
  .regex(/^(\/[\w\-./?=&#%]*|#[\w-]+|https:\/\/[\w\-./%?=&#:]+)$/, "Links must start with /, # or https://");
const image = z.string().trim().max(500).regex(/^(\/[\w\-./]+|https:\/\/[\w\-./%?=&]+)$/, "Image must be a /path or https URL");

export const headerContentSchema = z.object({
  logo: z.object({
    /** Optional uploaded logo. When set it replaces the "ET" mark and text. */
    image: image.or(z.literal("")),
    mark: text(3),
    text: text(30),
    highlight: text(30),
  }),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Menu item needs a label").max(30),
        href: link,
        /** Show the categories dropdown when hovering this item. */
        dropdown: z.boolean(),
      }),
    )
    .max(8, "Up to 8 menu items"),
  icons: z.object({
    search: z.boolean(),
    favorites: z.boolean(),
    cart: z.boolean(),
    theme: z.boolean(),
  }),
});

export type HeaderContent = z.infer<typeof headerContentSchema>;

export const HEADER_DEFAULTS: HeaderContent = {
  logo: { image: "", mark: "ET", text: "ET", highlight: "-Store" },
  links: [
    { label: "Browse", href: "/shop", dropdown: false },
    { label: "Bundles", href: "/shop?sort=featured", dropdown: false },
    { label: "Resources", href: "/#resources", dropdown: false },
  ],
  icons: { search: true, favorites: true, cart: true, theme: true },
};

export function headerWithDefaults(raw: unknown): HeaderContent {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const merged = {
    logo: { ...HEADER_DEFAULTS.logo, ...((obj.logo as object) ?? {}) },
    links: Array.isArray(obj.links) ? obj.links : HEADER_DEFAULTS.links,
    icons: { ...HEADER_DEFAULTS.icons, ...((obj.icons as object) ?? {}) },
  };
  const parsed = headerContentSchema.safeParse(merged);
  return parsed.success ? parsed.data : HEADER_DEFAULTS;
}
