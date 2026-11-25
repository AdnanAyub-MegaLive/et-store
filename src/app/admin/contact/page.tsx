import type { Metadata } from "next";
import { getContactContent } from "@/lib/home-content";
import { ContactEditor } from "./contact-editor";

export const metadata: Metadata = { title: "Contact page" };

export default async function ContactContentPage() {
  const content = await getContactContent();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact page</h1>
        <p className="mt-1 text-sm text-muted">Edit the heading, form topics and info cards on the Contact page. Messages arrive under Messages.</p>
      </div>
      <ContactEditor initial={content} />
    </div>
  );
}
