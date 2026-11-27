import "server-only";
import { cache } from "react";
import { getContent } from "@/lib/db";
import { withDefaults, type HomeContent } from "@/lib/home-content-schema";
import { headerWithDefaults, type HeaderContent } from "@/lib/header-content-schema";
import { aboutWithDefaults, type AboutContent } from "@/lib/about-content-schema";
import { contactWithDefaults, type ContactContent } from "@/lib/contact-content-schema";

export const HOME_KEY = "home";

/** Home page content from the database, falling back to the built-in defaults. */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  return withDefaults(await getContent(HOME_KEY));
});

export const HEADER_KEY = "header";

/** Site header (logo, menu, icons) from the database, falling back to the built-in defaults. */
export const getHeaderContent = cache(async (): Promise<HeaderContent> => {
  return headerWithDefaults(await getContent(HEADER_KEY));
});

export const ABOUT_KEY = "about";

/** About page content from the database, falling back to the built-in defaults. */
export const getAboutContent = cache(async (): Promise<AboutContent> => {
  return aboutWithDefaults(await getContent(ABOUT_KEY));
});

export const CONTACT_KEY = "contact";

/** Contact page content from the database, falling back to the built-in defaults. */
export const getContactContent = cache(async (): Promise<ContactContent> => {
  return contactWithDefaults(await getContent(CONTACT_KEY));
});
