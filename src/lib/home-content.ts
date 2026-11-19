import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { withDefaults, type HomeContent } from "@/lib/home-content-schema";
import { headerWithDefaults, type HeaderContent } from "@/lib/header-content-schema";

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
