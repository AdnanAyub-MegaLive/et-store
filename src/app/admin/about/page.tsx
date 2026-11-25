import type { Metadata } from "next";
import { getAboutContent } from "@/lib/home-content";
import { AboutEditor } from "./about-editor";

export const metadata: Metadata = { title: "About page" };

export default async function AboutContentPage() {
  const content = await getAboutContent();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">About page</h1>
        <p className="mt-1 text-sm text-muted">Edit the text and sections on the store&apos;s About page.</p>
      </div>
      <AboutEditor initial={content} />
    </div>
  );
}
