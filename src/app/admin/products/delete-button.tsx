"use client";

import { deleteProduct } from "@/lib/actions/admin";

export function DeleteButton({ id, name, className }: { id: string; name: string; className: string }) {
  return (
    <form
      action={deleteProduct}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={className}>Delete</button>
    </form>
  );
}
