import Link from "next/link";
import { PageHero } from "./page-hero";
import { SITE } from "@/lib/site";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Two-column legal layout: sticky table of contents + readable article. */
export function LegalPage({ crumb, title, highlight, intro, sections }: { crumb: string; title: string; highlight: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero crumb={crumb} eyebrow={`LAST UPDATED ${SITE.legalUpdated.toUpperCase()}`} title={title} highlight={highlight} intro={intro} />
      <div className="grid gap-10 pb-16 lg:grid-cols-[240px_1fr]">
        <nav data-slide="left" aria-label="On this page" className="h-fit rounded-[18px] border border-line bg-panel/70 p-5 text-sm backdrop-blur lg:sticky lg:top-24">
          <p className="mb-3 font-semibold">On this page</p>
          <ol className="flex flex-col gap-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 text-muted transition hover:translate-x-0.5 hover:text-brand">
                  <span className="tabular-nums text-brand/60">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="card flex flex-col gap-10 p-6 leading-7 text-muted sm:p-10 [&_a]:font-medium [&_a]:text-brand [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-3 flex items-center gap-3 text-xl font-semibold">
                <span className="bg-gradient-brand grid size-8 shrink-0 place-items-center rounded-lg text-sm text-white">{i + 1}</span>
                {s.title}
              </h2>
              <div className="flex flex-col gap-3">{s.body}</div>
            </section>
          ))}
          <p className="rounded-xl bg-surface p-4 text-sm">
            Questions about this page? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> or use our{" "}
            <Link href="/contact">contact form</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}
