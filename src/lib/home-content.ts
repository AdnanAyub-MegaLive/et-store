import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { withDefaults, type HomeContent } from "@/lib/home-content-schema";
import { headerWithDefaults, type HeaderContent } from "@/lib/header-content-schema";
import { aboutWithDefaults, type AboutContent } from "@/lib/about-content-schema";
import { contactWithDefaults, type ContactContent } from "@/lib/contact-content-schema";

export const HOME_KEY = "home";

/** Home page content from the database, falling back to the built-in defaults. */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const row = await db.siteContent.findUnique({ where: { key: HOME_KEY } });
  return withDefaults(row?.data);
});

export const HEADER_KEY = "header";

/** Site header (logo, menu, icons) from the database, falling back to the built-in defaults. */
export const getHeaderContent = cache(async (): Promise<HeaderContent> => {
  const row = await db.siteContent.findUnique({ where: { key: HEADER_KEY } });
  return headerWithDefaults(row?.data);
});

export const ABOUT_KEY = "about";

/** About page content from the database, falling back to the built-in defaults. */
export const getAboutContent = cache(async (): Promise<AboutContent> => {
  const row = await db.siteContent.findUnique({ where: { key: ABOUT_KEY } });
  return aboutWithDefaults(row?.data);
});

export const CONTACT_KEY = "contact";

/** Contact page content from the database, falling back to the built-in defaults. */
export const getContactContent = cache(async (): Promise<ContactContent> => {
  const row = await db.siteContent.findUnique({ where: { key: CONTACT_KEY } });
  return contactWithDefaults(row?.data);
});
