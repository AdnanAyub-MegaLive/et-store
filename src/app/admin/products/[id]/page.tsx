import { notFound } from "next/navigation";
import { cols, fromDoc, type Product } from "@/lib/db";
import { ProductForm } from "./product-form";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    cols().then(async (c) => (await c.categories.find({}, { projection: { name: 1 } }).sort({ position: 1, name: 1 }).toArray()).map((x) => ({ id: x._id, name: x.name }))),
    id === "new" ? null : cols().then(async (c) => fromDoc<Product>(await c.products.findOne({ _id: id }))),
  ]);
  if (id !== "new" && !product) notFound();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{product ? `Edit ${product.name}` : "New product"}</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
