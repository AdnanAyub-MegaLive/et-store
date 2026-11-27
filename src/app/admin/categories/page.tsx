import type { Metadata } from "next";
import { categoriesWithCounts } from "@/lib/db";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await categoriesWithCounts();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          These show in the header dropdown, on the home page and in the shop filters, in this order.
        </p>
      </div>
      <CategoryManager categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, products: c._count.products }))} />
    </div>
  );
}
