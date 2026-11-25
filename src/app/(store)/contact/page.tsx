import type { Metadata } from "next";
import Link from "next/link";
import { turnstileSiteKey } from "@/lib/turnstile";
import { PageHero } from "@/components/page-hero";
import { getContactContent } from "@/lib/home-content";
import { ABOUT_ICON_MAP, CONTACT_COLORS } from "@/lib/about-icons";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the ET-Store team." };

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "font-medium text-brand";
  if (href.startsWith("/")) return <Link className={cls} href={href}>{children}</Link>;
  return <a className={cls} href={href} {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [{ topic }, c] = await Promise.all([searchParams, getContactContent()]);
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero crumb="Contact" eyebrow={c.hero.eyebrow} title={c.hero.title} highlight={c.hero.highlight || undefined} intro={c.hero.intro || undefined} />
      <div className={`grid gap-8 pb-16 ${c.cards.length ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        <div data-slide="left" className="card border-t-4 border-t-fuchsia-400 p-6 sm:p-8">
          <ContactForm initialTopic={topic} siteKey={turnstileSiteKey()} title={c.form.title} topics={c.form.topics} />
        </div>
        {c.cards.length > 0 && (
          <aside data-stagger className="flex flex-col gap-4">
            {c.cards.map((card, i) => {
              const Icon = ABOUT_ICON_MAP[card.icon];
              return (
                <div key={i} className="card flex gap-4 p-5">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${CONTACT_COLORS[i % CONTACT_COLORS.length]} text-white shadow-md`}>
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{card.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {card.text}
                      {card.text && card.linkLabel && card.linkHref ? " " : null}
                      {card.linkLabel && card.linkHref ? <CardLink href={card.linkHref}>{card.linkLabel}</CardLink> : card.linkLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </aside>
        )}
      </div>
    </div>
  );
}
