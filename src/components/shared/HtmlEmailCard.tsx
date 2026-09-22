import { cn } from "@/lib/utils";

/** Same framed document the lead thread uses for a scaled email thumbnail. */
export function emailPreviewSrcDoc(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;}</style></head><body>${html}</body></html>`;
}

export function HtmlEmailCard({
  title,
  html,
  className,
}: {
  title: string;
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-36 w-full overflow-hidden rounded-md border border-white/10 bg-white",
        className,
      )}
    >
      <iframe
        title={`${title} preview`}
        sandbox=""
        srcDoc={emailPreviewSrcDoc(html)}
        tabIndex={-1}
        className="pointer-events-none absolute top-0 left-0 h-[280%] w-[280%] origin-top-left scale-[0.36] border-0"
      />
    </div>
  );
}
