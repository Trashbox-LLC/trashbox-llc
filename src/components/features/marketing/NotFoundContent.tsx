import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { SERVICE_PATHS } from "@/lib/sites";

export function NotFoundContent() {
  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col pt-28 md:pt-32">
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#1c1b1b_0%,#131313_100%)] px-6 pb-16 md:px-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
          <Image
            src="/images/trashbox-logo-outlined.svg"
            alt=""
            width={1024}
            height={1024}
            className="w-[80vw] max-w-4xl"
          />
        </div>

        <div className="relative z-10 flex w-full max-w-7xl flex-col items-end justify-between gap-12 md:flex-row">
          <div className="flex max-w-2xl flex-col items-start">
            <span className="mb-8 block font-label text-xs tracking-[0.4em] text-outline uppercase">
              Error Code 0x404
            </span>
            <h1 className="select-none font-headline text-[12rem] leading-none font-bold tracking-tighter text-primary [text-shadow:0_0_30px_rgba(255,255,255,0.1)] md:text-[22rem]">
              404
            </h1>
            <div className="-mt-8 ml-2 pt-3 md:-mt-16 md:pt-5">
              <h2 className="max-w-md font-headline text-4xl font-light tracking-tight text-on-surface md:text-6xl">
                This link belongs in the <span className="font-normal italic">trash.</span>
              </h2>
              <p className="mt-6 max-w-sm font-body text-lg leading-relaxed text-secondary opacity-70">
                The resource you are looking for has been decommissioned or moved to a permanent
                archive.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-12 md:w-auto md:items-end">
            <div className="flex w-full flex-col gap-4 md:w-64">
              <Button
                asChild
                size="lg"
                className="group justify-between hover:scale-[0.98] active:scale-95"
              >
                <Link href="/">
                  <span>Back to Safety</span>
                  <MaterialIcon
                    name="arrow_forward"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="group justify-between hover:bg-surface-container-low"
              >
                <Link href="/apps">
                  <span>View Apps</span>
                  <MaterialIcon name="inventory_2" className="opacity-40" />
                </Link>
              </Button>
            </div>

            <nav className="flex flex-col items-start gap-3 md:items-end">
              <p className="mb-2 font-label text-[10px] tracking-[0.3em] text-outline-variant uppercase">
                Helpful Destinations
              </p>
              <ul className="flex flex-col items-start gap-2 md:items-end">
                <li>
                  <Link
                    href="/about"
                    className="block py-1 text-sm font-medium transition-colors hover:text-primary"
                  >
                    About the Studio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/apps"
                    className="block py-1 text-sm font-medium transition-colors hover:text-primary"
                  >
                    Active Apps
                  </Link>
                </li>
                <li>
                  <Link
                    href={SERVICE_PATHS.contact}
                    className="block py-1 text-sm font-medium transition-colors hover:text-primary"
                  >
                    Contact Engineering
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 hidden md:block">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-outline-variant/30" />
            <span className="font-mono text-[10px] tracking-widest text-outline-variant uppercase">
              System.NullReferenceException: Object not found
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
