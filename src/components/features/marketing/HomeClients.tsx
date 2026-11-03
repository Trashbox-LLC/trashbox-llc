import { PORTFOLIO_SITES } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const MARKS = [
  {
    label: "Riley Musil",
    siteName: "Riley Musil",
    className: "font-headline text-lg font-medium tracking-tight",
  },
  {
    label: "Texas Covenant",
    siteName: "Texas Covenant Home Inspections",
    className: "font-body text-sm font-semibold tracking-wide",
  },
  {
    label: "Monarch",
    siteName: "Monarch Home Inspections",
    className: "font-headline text-xl font-bold tracking-tight",
  },
  {
    label: "Lacelle",
    siteName: "Lacelle Pastries",
    className: "font-headline text-2xl font-light italic",
  },
  {
    label: "RJ Inspections",
    siteName: "RJ Inspections",
    className: "font-headline text-sm font-medium tracking-[0.16em]",
  },
  {
    label: "Salus",
    siteName: "Salus Integrative Health",
    className: "font-headline text-2xl font-semibold tracking-tight",
  },
] as const;

export function HomeClients() {
  const marks = MARKS.map((mark) => {
    const site = PORTFOLIO_SITES.find((item) => item.name === mark.siteName);
    if (!site) {
      throw new Error(`Missing portfolio site: ${mark.siteName}`);
    }
    return { ...mark, href: site.href, name: site.name };
  });

  return (
    <section aria-labelledby="home-clients" className="bg-[#010101] px-5 pt-6 pb-16 sm:px-8 sm:pb-20">
      <h2
        id="home-clients"
        className="text-center text-sm text-white/70 sm:text-base"
      >
        Trusted By Local Businesses
      </h2>
      <ul className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
        {marks.map((mark) => (
          <li key={mark.href}>
            <a
              href={mark.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit ${mark.name}`}
              className={cn(
                "text-white transition-opacity hover:opacity-70",
                mark.className,
              )}
            >
              {mark.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
