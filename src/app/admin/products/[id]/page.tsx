import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "./product-form";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    db.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    id === "new" ? null : db.product.findUnique({ where: { id } }),
  ]);
  if (id !== "new" && !product) notFound();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{product ? `Edit ${product.name}` : "New product"}</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
