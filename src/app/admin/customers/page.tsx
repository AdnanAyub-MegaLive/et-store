import { cols } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { setUserRole } from "@/lib/actions/admin";

export default async function CustomersPage() {
  const me = await requireAdmin();
  const { users: usersCol, orders } = await cols();
  const list = await usersCol.find({}, { projection: { name: 1, email: 1, role: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(100).toArray();
  const paid = await orders.find({ userId: { $in: list.map((u) => u._id) }, status: "PAID" }, { projection: { userId: 1, total: 1 } }).toArray();
  const users = list.map(({ _id, ...u }) => ({ ...u, id: _id, orders: paid.filter((o) => o.userId === _id).map((o) => ({ total: o.total })) }));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left">{["Name", "Email", "Joined", "Paid orders", "Spent", "Role"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">{shortDate(u.createdAt)}</td>
                <td className="px-4 py-3">{u.orders.length}</td>
                <td className="px-4 py-3">{money(u.orders.reduce((s, o) => s + o.total, 0))}</td>
                <td className="px-4 py-3">
                  {u.id === me.id ? (
                    <span className="text-xs text-muted">ADMIN (you)</span>
                  ) : (
                    <form action={setUserRole} className="flex gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="rounded-lg border border-line px-2 py-1 text-xs"><option>USER</option><option>ADMIN</option></select>
                      <button className="text-xs font-medium text-brand">Save</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
