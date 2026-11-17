import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service", description: "The terms for buying and using products on ET-Store." };

// DRAFT: have a lawyer review these terms for your country before launch.
const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: (
      <p>
        These Terms of Service (&quot;Terms&quot;) form an agreement between you and {SITE.legalName} (&quot;ET-Store&quot;,
        &quot;we&quot;, &quot;us&quot;). By creating an account, browsing, or buying on ET-Store you agree to these Terms. If you do not
        agree, please do not use the site.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <ul>
        <li>You must be at least 16 years old, or the age of majority where you live, to create an account.</li>
        <li>Keep your password secure. You are responsible for activity on your account.</li>
        <li>Give us accurate information and keep your email address up to date so we can send receipts and important notices.</li>
        <li>We may suspend accounts that break these Terms or put other users at risk.</li>
      </ul>
    ),
  },
  {
    id: "purchases",
    title: "Purchases and payment",
    body: (
      <>
        <p>
          Prices are shown in US dollars and include any discount shown on the product page. Sales tax is added at checkout and
          shown before you pay.
        </p>
        <p>
          Payments are processed by <strong>Stripe</strong>. We never see or store your full card details. An order is complete
          once Stripe confirms the payment, after which the product becomes available in your account.
        </p>
      </>
    ),
  },
  {
    id: "licence",
    title: "Product licence",
    body: (
      <>
        <p>When you buy a product you receive a personal, non-exclusive, non-transferable licence to use it. You may:</p>
        <ul>
          <li>Use the product in unlimited personal and commercial projects, including client work.</li>
          <li>Modify the product to suit your project.</li>
        </ul>
        <p>You may not:</p>
        <ul>
          <li>Resell, sublicense, share or redistribute the original files, alone or in a bundle, even for free.</li>
          <li>Use the product in a template, theme or asset that you sell or give away for others to reuse.</li>
          <li>Claim the product, or a lightly modified version of it, as your own original work.</li>
        </ul>
        <p>Each licence covers one person. Teams need one licence for each person using the files.</p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          Because digital products are delivered instantly, sales are generally final. We will refund your purchase if, within{" "}
          <strong>{SITE.refundDays} days</strong> of buying, the product is broken, materially different from its description, or
          you were charged twice.
        </p>
        <p>
          Request a refund through our <Link href="/contact?topic=Refund%20request">contact form</Link>. Approved refunds are returned
          to your original payment method by Stripe, usually within 5 to 10 business days. Refunded products are removed from your
          library and your licence to use them ends. This does not affect any rights you have under consumer law where you live.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <ul>
        <li>Do not attempt to access other users&apos; accounts or data, or interfere with the security of the site.</li>
        <li>Do not scrape, copy or mirror the site or its product files using automated tools.</li>
        <li>Do not use ET-Store for anything unlawful, fraudulent or harmful.</li>
      </ul>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        Products remain the property of their creators. The ET-Store name, logo, site design and content belong to us. Except
        for the licence above, nothing in these Terms transfers ownership of any intellectual property to you.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and liability",
    body: (
      <p>
        Products are provided &quot;as is&quot;. To the extent allowed by law, we are not liable for indirect or consequential losses,
        and our total liability for any claim is limited to the amount you paid for the product involved. Nothing in these Terms
        limits liability that cannot be limited by law.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and governing law",
    body: (
      <p>
        We may update these Terms from time to time. If changes are significant we will tell you by email or on the site before
        they take effect. These Terms are governed by the laws of {SITE.country}.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      crumb="Terms of Service"
      title="Terms of"
      highlight="Service"
      intro="The rules for buying and using products on ET-Store, written to be read, not skimmed."
      sections={sections}
    />
  );
}
