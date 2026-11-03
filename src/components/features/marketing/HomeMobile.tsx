import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/atoms/Reveal";
import { SERVICE_PATHS } from "@/lib/sites";

const PHONE = {
  src: "/images/home/home-phone-calorie-tracker.webp",
  alt: "Calorie & Protein Tracker on a phone",
  width: 522,
  height: 1647,
  blurDataURL:
    "data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAAAwAQCdASoFABAABUB8JZwAA3AA/vAgv6+6IILff/B144skkAAAAA==",
} as const;

export function HomeMobile() {
  return (
    <section className="bg-black px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto grid max-w-screen-2xl items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal fade className="relative lg:h-full">
          <div className="max-w-2xl lg:absolute lg:top-[28%] lg:right-0 lg:left-16 lg:-translate-y-1/2 xl:left-28">
            <h2 className="font-headline text-5xl leading-[1.05] font-bold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
              <Link
                href={SERVICE_PATHS.mobileApps}
                className="transition-colors hover:text-white/70"
              >
                Apps for the phone in their hand.
              </Link>
            </h2>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-on-surface-variant lg:text-xl">
              Shipped as a focused first release, or grown into a long-term
              product.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <Image
            src={PHONE.src}
            alt={PHONE.alt}
            width={PHONE.width}
            height={PHONE.height}
            placeholder="blur"
            blurDataURL={PHONE.blurDataURL}
            sizes="(max-width: 1024px) 72vw, 18rem"
            className="mx-auto h-auto w-full max-w-[18rem]"
          />
        </Reveal>
      </div>
    </section>
  );
}
