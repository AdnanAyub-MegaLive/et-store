import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const cols = [
  { title: "Product", links: [["Browse products", "/shop"], ["Categories", "/#categories"], ["Bundles", "/shop"]] },
  { title: "Company", links: [["About ET-Store", "/about"], ["Careers", "/careers"], ["Contact", "/contact"]] },
  { title: "Support", links: [["Help center", "/help"], ["Order support", "/account"], ["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"]] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        {cols.map((c) => (
          <div key={c.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">{c.title}</h2>
            {c.links.map(([label, href]) => (
              <Link key={label} href={href} className="w-fit text-sm text-muted transition hover:translate-x-0.5 hover:text-brand">
                {label}
              </Link>
            ))}
          </div>
        ))}
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <h2 className="text-sm font-semibold">Stay in the loop</h2>
          <p className="text-sm text-muted">Get fresh finds and marketplace news in your inbox.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1280px] px-4 py-4 text-xs text-muted sm:px-6">© {new Date().getFullYear()} ET-Store. All rights reserved.</p>
      </div>
    </footer>
  );
}
