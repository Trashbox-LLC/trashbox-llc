import type { Metadata } from "next";
import { FadeIn } from "@/components/atoms/FadeIn";
import { marketingMetadata } from "@/lib/seo";
import { API_DOCS_URL, PLATFORM_PATHS, PORTAL_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Trashbox CRM API",
  description:
    "Send website form leads into Trashbox CRM with a simple API key.",
  path: PLATFORM_PATHS.api,
});

const example = `const response = await fetch("https://api.trashbox.io/submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": "fapi_your_key_here",
  },
  body: JSON.stringify({
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "I'd like a quote…",
    _honeypot: "",
    metadata: { page: "/contact" },
  }),
});`;

export default function PortalApiPage() {
  return (
    <div>
      <FadeIn>
        <p className="font-label text-outline mb-6 text-xs tracking-[0.4em] uppercase">
          API
        </p>
        <h1 className="font-headline max-w-3xl text-4xl font-bold tracking-tighter text-white md:text-6xl">
          Capture leads from any site.
        </h1>
        <p className="text-on-surface-variant mt-6 max-w-xl text-lg">
          Connect your contact forms to Trashbox CRM with one endpoint. New
          inquiries show up as leads you can message, reply to, and follow up
          with templates.
        </p>
        <p className="text-on-surface-variant mt-4 max-w-xl text-base">
          POST JSON to <code className="text-white">/submit</code> with your API
          key. Restrict allowed origins so the key only works from your domains.
        </p>
      </FadeIn>

      <pre className="border-outline-variant/10 bg-surface-container-low text-on-surface-variant mt-12 overflow-x-auto border p-6 font-mono text-xs leading-relaxed md:text-sm">
        <code>{example}</code>
      </pre>

      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href={API_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="bg-primary font-headline text-on-primary px-8 py-4 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
        >
          Open API docs
        </a>
        <a
          href={PORTAL_PATHS.login}
          className="border-outline-variant/30 font-headline border px-8 py-4 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:border-white"
        >
          Get an API key
        </a>
      </div>
    </div>
  );
}
