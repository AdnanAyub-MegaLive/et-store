import { Mail, MailOpen, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { deleteMessage, setMessageRead } from "@/lib/actions/admin";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const filter = (await searchParams).filter === "unread" ? "unread" : "all";
  const [messages, unread] = await Promise.all([
    db.contactMessage.findMany({ where: filter === "unread" ? { read: false } : {}, orderBy: { createdAt: "desc" }, take: 100 }),
    db.contactMessage.count({ where: { read: false } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="mt-1 text-sm text-muted">{unread} unread from the contact form</p>
        </div>
        <div className="flex rounded-xl bg-surface p-1 text-sm">
          {["all", "unread"].map((f) => (
            <a key={f} href={f === "all" ? "?" : "?filter=unread"} className={`rounded-lg px-3 py-1.5 capitalize ${filter === f ? "bg-panel shadow-sm" : "text-muted"}`}>{f}</a>
          ))}
        </div>
      </div>

      {messages.length === 0 && <p className="card p-10 text-center text-muted">No messages yet.</p>}

      <div data-stagger className="flex flex-col gap-3">
        {messages.map((m) => (
          <article key={m.id} className={`card p-5 ${m.read ? "" : "border-l-4 border-l-fuchsia-400"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {m.name} {!m.read && <span className="ml-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                </p>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`} className="text-sm text-brand">{m.email}</a>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-surface px-2 py-1">{m.topic}</span>
                {m.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
            {/* Rendered as text, never HTML, so visitor input can't inject markup. */}
            <p className="mt-3 whitespace-pre-wrap leading-7 text-muted">{m.message}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <form action={setMessageRead}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={String(!m.read)} />
                <button className="inline-flex items-center gap-1.5 font-medium text-brand">
                  {m.read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
                  {m.read ? "Mark unread" : "Mark as read"}
                </button>
              </form>
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={m.id} />
                <button className="inline-flex items-center gap-1.5 font-medium text-red-600"><Trash2 className="size-4" />Delete</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
