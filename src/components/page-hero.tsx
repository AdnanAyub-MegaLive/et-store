import Link from "next/link";

/** Shared top section for content pages: breadcrumb, eyebrow, animated title with a gradient word, intro. */
export function PageHero({
  crumb,
  eyebrow,
  title,
  highlight,
  intro,
  center = false,
}: {
  crumb: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  intro?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <header className={`flex flex-col gap-4 pb-10 pt-4 ${center ? "items-center text-center" : ""}`}>
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> / {crumb}
      </p>
      <p className="animate-fade-up w-fit rounded-full border border-brand/20 bg-brand-soft/60 px-3 py-1 text-xs font-semibold tracking-[1.4px] text-brand">
        {eyebrow}
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-1px] sm:text-5xl">
        <span data-split>{title}</span>
        {highlight && (
          <>
            {" "}
            <span className="text-gradient animate-fade-up inline-block [animation-delay:350ms]">{highlight}</span>
          </>
        )}
      </h1>
      {intro && <div className={`animate-fade-up max-w-2xl text-lg leading-8 text-muted [animation-delay:200ms] ${center ? "mx-auto" : ""}`}>{intro}</div>}
    </header>
  );
}
