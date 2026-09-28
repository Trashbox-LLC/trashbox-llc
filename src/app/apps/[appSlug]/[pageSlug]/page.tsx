import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownDocument } from "@/components/features/marketing/MarkdownDocument";
import {
  getAppMarkdown,
  getAppPageMeta,
  listAppMarkdownPages,
  titleCaseSegment,
} from "@/lib/apps/registry";
import { marketingMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ appSlug: string; pageSlug: string }>;
};

export function generateStaticParams() {
  return listAppMarkdownPages();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { appSlug, pageSlug } = await params;
  const meta = getAppPageMeta(appSlug, pageSlug);
  const title =
    meta?.title ??
    `${titleCaseSegment(appSlug)} — ${titleCaseSegment(pageSlug)}`;

  return marketingMetadata({
    title,
    description:
      meta?.description ??
      `${titleCaseSegment(pageSlug)} for ${titleCaseSegment(appSlug)}.`,
    path: `/apps/${appSlug}/${pageSlug}`,
  });
}

export default async function Page({ params }: PageProps) {
  const { appSlug, pageSlug } = await params;
  const markdown = getAppMarkdown(appSlug, pageSlug);

  if (!markdown) {
    return (
      <div className="mx-auto max-w-2xl px-8 pt-32 pb-24 text-center">
        <p className="font-headline text-outline mb-2 text-xs tracking-[0.3em] uppercase">
          Apps
        </p>
        <h1 className="font-headline text-primary mb-6 text-4xl font-bold tracking-tighter">
          Page not found
        </h1>
        <p className="text-on-surface-variant mb-10">
          There is no <span className="text-on-background">{pageSlug}</span>{" "}
          page for <span className="text-on-background">{appSlug}</span>.
        </p>
        <Link
          href="/apps"
          className="border-outline-variant font-headline text-primary inline-flex items-center gap-2 border px-8 py-3 text-xs font-bold tracking-widest uppercase transition-colors hover:bg-white/5"
        >
          Back to apps
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-28 pb-24 md:px-8 md:pt-32">
      <nav className="font-headline text-outline mb-10 text-xs tracking-widest uppercase">
        <Link href="/apps" className="hover:text-primary transition-colors">
          Apps
        </Link>
        <span className="text-outline-variant mx-2">/</span>
        <span className="text-on-surface-variant">{appSlug}</span>
        <span className="text-outline-variant mx-2">/</span>
        <span className="text-primary">{pageSlug}</span>
      </nav>

      <div className="bg-surface-container-low/40 rounded-xl border border-white/5 p-8 md:p-12">
        <MarkdownDocument markdown={markdown} />
      </div>
    </div>
  );
}
