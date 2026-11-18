import type { Metadata } from "next";
import { getHomeContent } from "@/lib/home-content";
import { HomeEditor } from "./home-editor";

export const metadata: Metadata = { title: "Home page" };

export default async function HomeContentPage() {
  const content = await getHomeContent();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Home page</h1>
        <p className="mt-1 text-sm text-muted">
          Edit the text, images and sections on the store&apos;s home page. Categories and products come from the Products page.
        </p>
      </div>
      <HomeEditor initial={content} />
    </div>
  );
}
