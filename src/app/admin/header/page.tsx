import type { Metadata } from "next";
import { getHeaderContent } from "@/lib/home-content";
import { HeaderEditor } from "./header-editor";

export const metadata: Metadata = { title: "Header" };

export default async function HeaderContentPage() {
  const content = await getHeaderContent();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Header</h1>
        <p className="mt-1 text-sm text-muted">Edit the logo, the menu links and which icons show in the top bar of the store.</p>
      </div>
      <HeaderEditor initial={content} />
    </div>
  );
}
