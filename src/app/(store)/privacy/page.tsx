import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "What data ET-Store collects, why, and your rights." };

// DRAFT: written to match how this site actually handles data. Have it reviewed by a lawyer before launch.
const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        {SITE.legalName}, {SITE.address}, runs ET-Store and is responsible for your personal data. Contact us about privacy at{" "}
        <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <ul>
        <li><strong>Account details:</strong> your name, email address and a securely hashed password (we never store it in plain text).</li>
        <li><strong>Order details:</strong> the products you buy, prices, and the billing name and address you enter at checkout.</li>
        <li><strong>Payment details:</strong> handled entirely by Stripe. We receive a payment reference, never your card number.</li>
        <li><strong>Messages:</strong> what you send us through the contact form.</li>
        <li><strong>Newsletter:</strong> your email address, if you subscribe.</li>
        <li><strong>Technical data:</strong> your IP address, used briefly to protect the site against abuse such as repeated login attempts.</li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To create and secure your account and keep you signed in.</li>
        <li>To process orders, deliver downloads and send receipts.</li>
        <li>To answer your questions and handle refunds.</li>
        <li>To send the newsletter, only if you subscribed. Every email has an unsubscribe link.</li>
        <li>To prevent fraud and keep the site secure.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>We keep this minimal and do not use advertising or tracking cookies.</p>
        <ul>
          <li><strong>Session cookie</strong> (lm_session): keeps you signed in. Essential, secure and inaccessible to scripts.</li>
          <li><strong>Local storage</strong>: remembers your cart and your light or dark theme on your own device.</li>
          <li><strong>Stripe</strong> may set its own cookies on its checkout page to prevent fraud.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We never sell your data. We share it only with providers that help run the service:</p>
        <ul>
          <li><strong>Stripe</strong>, to process payments and refunds.</li>
          <li>Our hosting, database and email providers, to run the site and send emails.</li>
          <li>Authorities, only where the law requires it.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep account data while your account is open. Order records are kept as long as tax and accounting law requires.
        Contact messages are deleted once they are no longer needed. Password reset links expire after 30 minutes.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Depending on where you live, you can ask us to:</p>
        <ul>
          <li>Give you a copy of your personal data.</li>
          <li>Correct anything that is wrong.</li>
          <li>Delete your account and personal data.</li>
          <li>Stop sending you marketing emails.</li>
        </ul>
        <p>
          Send requests to <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> or through our{" "}
          <Link href="/contact">contact form</Link>. You can also complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Passwords are hashed with bcrypt, sessions use signed, secure cookies, connections are encrypted, and access to admin tools
        is restricted. No system is perfectly secure, but we work to protect your data and will tell you promptly if a breach
        affects you.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <p>If we make significant changes, we will let you know by email or with a notice on the site before they take effect.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      crumb="Privacy Policy"
      title="Privacy"
      highlight="Policy"
      intro="What data we collect, why we collect it, and the control you have over it."
      sections={sections}
    />
  );
}
