import type { Metadata } from "next";
import { FadeIn } from "@/components/atoms/FadeIn";
import { marketingMetadata } from "@/lib/seo";
import { API_DOCS_URL, PLATFORM_PATHS, PORTAL_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Trashbox CRM Documentation",
  description:
    "Accounts, teams, lead capture, templates, and billing for Trashbox CRM.",
  path: PLATFORM_PATHS.documentation,
});

const sections = [
  {
    title: "Account",
    body: "Sign up on the portal and create your business workspace. No card required to start capturing leads.",
  },
  {
    title: "Leads and messaging",
    body: "New form submissions land in your Trashbox CRM inbox. Reply from the built-in messaging tools and keep every conversation in one place.",
  },
  {
    title: "Email templates",
    body: "Use templates to follow up faster and more consistently—helping increase customer response rates by 40%.",
  },
  {
    title: "Team access",
    body: "Invite teammates securely so the right people can manage leads without sharing logins.",
  },
  {
    title: "API keys",
    body: "Issue or rotate a key from your account. The raw key is shown once—store it in your site env as the X-Api-Key header value.",
  },
  {
    title: "Billing",
    body: "Start on Free, then add Solo or Team via Stripe Checkout. Manage or cancel anytime from the billing portal. Lead volume resets each UTC month.",
  },
] as const;

export default function PortalDocumentationPage() {
  return (
    <div>
      <FadeIn>
        <p className="font-label text-outline mb-6 text-xs tracking-[0.4em] uppercase">
          Documentation
        </p>
        <h1 className="font-headline max-w-3xl text-4xl font-bold tracking-tighter text-white md:text-6xl">
          How Trashbox CRM fits together.
        </h1>
        <p className="text-on-surface-variant mt-6 max-w-xl text-lg">
          A quick guide for owners focused on lead generation and retention. For
          request and response schemas, use the live OpenAPI docs.
        </p>
      </FadeIn>

      <div className="mt-16 space-y-8">
        {sections.map((section) => (
          <section
            key={section.title}
            className="border-outline-variant/10 bg-surface-container-low border p-8"
          >
            <h2 className="font-headline text-2xl font-bold text-white">
              {section.title}
            </h2>
            <p className="text-on-surface-variant mt-3 max-w-2xl text-sm leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <a
          href={API_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="bg-primary font-headline text-on-primary px-8 py-4 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
        >
          OpenAPI reference
        </a>
        <a
          href={PORTAL_PATHS.login}
          className="border-outline-variant/30 font-headline border px-8 py-4 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:border-white"
        >
          Login
        </a>
      </div>
    </div>
  );
}
