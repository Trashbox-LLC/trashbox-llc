import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/atoms/Reveal";
import { SERVICE_PATHS } from "@/lib/sites";

const LAPTOP = {
  src: "/images/home/home-laptop-texas-covenant.webp",
  alt: "Texas Covenant Home Inspections website on a laptop",
  width: 1280,
  height: 720,
  blurDataURL:
    "data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAACQAQCdASoQAAkABUB8JaQAApLtXyAA/vKqcd22BEyiPM1v3LjoNars35RmZi55m+EoAU9uAAA=",
} as const;

export function HomeWebsites() {
  return (
    <section className="bg-black px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto grid max-w-screen-2xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <Image
            src={LAPTOP.src}
            alt={LAPTOP.alt}
            width={LAPTOP.width}
            height={LAPTOP.height}
            placeholder="blur"
            blurDataURL={LAPTOP.blurDataURL}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-auto w-full"
          />
        </Reveal>
        <Reveal fade className="flex flex-col items-center text-center lg:items-end lg:pr-16 lg:text-right xl:pr-28">
          <h2 className="font-headline max-w-2xl text-5xl leading-[1.05] font-bold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
            <Link
              href={SERVICE_PATHS.websites}
              className="transition-colors hover:text-white/70"
            >
              Sites that look sharp and convert.
            </Link>
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-on-surface-variant lg:text-xl">
            From a focused launch site to a full brand presence—built to be
            clear, fast, and easy to hand off or keep improving.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
