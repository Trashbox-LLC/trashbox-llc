import Link from "next/link";
import { SERVICE_OFFERINGS } from "@/components/features/marketing/service-offerings";
import { cn } from "@/lib/utils";
import { PLATFORM_PATHS, SERVICE_PATHS } from "@/lib/sites";

type ServiceLink = {
  key: string;
  href: string;
  title: string;
};

const serviceLinks: ServiceLink[] = [
  ...SERVICE_OFFERINGS.map((offering) => ({
    key: offering.slug,
    href: SERVICE_PATHS[offering.slug],
    title: offering.title,
  })),
  {
    key: "crm",
    href: PLATFORM_PATHS.hub,
    title: "Customer Relationship Management",
  },
];

function matchesPath(pathname: string, href: string): boolean {
  const current = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  return current === target || current.startsWith(`${target}/`);
}

function ServiceLinks({
  pathname,
  onNavigate,
  tabIndex,
}: {
  pathname: string;
  onNavigate: () => void;
  tabIndex?: number;
}) {
  return serviceLinks.map((item) => {
    const current = matchesPath(pathname, item.href);
    return (
      <Link
        key={item.key}
        href={item.href}
        tabIndex={tabIndex}
        aria-current={current ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "block px-4 py-2 font-headline text-sm tracking-tight transition-colors",
          item.key === "crm" && "mt-1 border-t border-white/10 pt-3",
          current ? "text-white" : "text-white/60 hover:text-white",
        )}
      >
        {item.title}
      </Link>
    );
  });
}

export function ServicesMenu({
  pathname,
  onNavigate,
  open,
}: {
  pathname: string;
  onNavigate: () => void;
  open: boolean;
}) {
  return (
    <div
      className={cn(
        "w-max border py-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 ease-out motion-reduce:transition-none",
        open
          ? "border-white/15 bg-black/40 backdrop-blur-xl"
          : "border-transparent bg-black/0 shadow-none backdrop-blur-[0px]",
      )}
    >
      <div
        className={cn(
          "transition-opacity duration-200 ease-out motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        <ServiceLinks pathname={pathname} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function ServicesMenuList({
  pathname,
  onNavigate,
  tabIndex,
}: {
  pathname: string;
  onNavigate: () => void;
  tabIndex?: number;
}) {
  return (
    <div className="flex flex-col pt-1">
      <ServiceLinks
        pathname={pathname}
        onNavigate={onNavigate}
        tabIndex={tabIndex}
      />
    </div>
  );
}
