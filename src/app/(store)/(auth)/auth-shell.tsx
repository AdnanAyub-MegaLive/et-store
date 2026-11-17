import { Check } from "lucide-react";

export function AuthShell({ heading, sub, children }: { heading: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
      <div className="animate-fade-up mx-auto grid max-w-[856px] overflow-hidden rounded-[18px] border border-line bg-panel shadow-[0_30px_60px_-30px_rgba(103,48,204,0.35)] md:grid-cols-2">
        <div className="bg-gradient-brand relative hidden flex-col justify-center gap-6 overflow-hidden p-11 text-on-brand md:flex">
          <div aria-hidden className="aurora-blob -bottom-24 -right-24 size-72 bg-amber-300/40" />
          <div aria-hidden className="aurora-blob -left-20 -top-20 size-64 bg-cyan-300/30 [animation-delay:-7s]" />
          <span data-pop="0.2" aria-hidden className="relative grid size-11 place-items-center rounded-xl bg-white/20 text-sm font-extrabold tracking-[-0.5px] backdrop-blur">ET</span>
          <h2 data-split className="relative text-2xl font-semibold">Your best work starts here.</h2>
          <p className="relative leading-6 text-on-brand/85">Sign in to access your purchases, saved products, and creator toolkit.</p>
          <ul data-stagger className="relative flex flex-col gap-3 text-sm text-on-brand/90">
            {["Instant downloads", "Curated quality", "Built for creators"].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="grid size-5 place-items-center rounded-full bg-white/25"><Check className="size-3" /></span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-5 p-8 sm:p-11">
          <div>
            <h1 data-split className="text-2xl font-semibold">{heading}</h1>
            <p className="mt-2 text-sm text-muted">{sub}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{error}</p>;
  if (ok) return <p role="status" className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand">{ok}</p>;
  return null;
}
