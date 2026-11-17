import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LifeBuoy, Mail } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the ET-Store team." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const cards = [
    { icon: Mail, title: "Email us", text: <a className="font-medium text-brand" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>, color: "from-violet-500 to-fuchsia-500" },
    { icon: Clock, title: "Response time", text: `We reply ${SITE.responseTime}.`, color: "from-cyan-400 to-sky-500" },
    { icon: LifeBuoy, title: "Quick answers", text: <>Most questions are answered in our <Link className="font-medium text-brand" href="/help">Help Center</Link>.</>, color: "from-amber-400 to-orange-500" },
  ];
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero crumb="Contact" eyebrow="GET IN TOUCH" title="We'd love to" highlight="hear from you." intro="Questions about an order, a licence, or selling on ET-Store? Send us a message." />
      <div className="grid gap-8 pb-16 lg:grid-cols-[1fr_360px]">
        <div data-slide="left" className="card border-t-4 border-t-fuchsia-400 p-6 sm:p-8">
          <ContactForm initialTopic={topic} />
        </div>
        <aside data-stagger className="flex flex-col gap-4">
          {cards.map((c) => (
            <div key={c.title} className="card flex gap-4 p-5">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-md`}>
                <c.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="mt-1 text-sm text-muted">{c.text}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
