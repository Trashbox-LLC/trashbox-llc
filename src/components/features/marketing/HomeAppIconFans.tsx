import Image from "next/image";
import { Reveal } from "@/components/atoms/Reveal";
import { cn } from "@/lib/utils";

const ICONS = [
  {
    src: "/images/home/app-icon-rings.webp",
    alt: "Calorie & Protein Tracker icon with activity rings",
  },
  {
    src: "/images/home/app-icon-apple.webp",
    alt: "Calorie & Protein Tracker icon with an apple and progress ring",
  },
  {
    src: "/images/home/app-icon-check.webp",
    alt: "Calorie & Protein Tracker icon with a check mark and progress ring",
  },
] as const;

const FANS = [
  {
    id: "pivot",
    stage:
      "flex items-end justify-center px-2 pt-6 pb-2",
    icons: [
      "z-0 w-28 origin-bottom -translate-x-1 -rotate-[24deg] sm:w-40 sm:-translate-x-3 lg:w-48",
      "z-10 -mx-8 w-32 origin-bottom sm:-mx-12 sm:w-44 lg:w-56",
      "z-0 w-28 origin-bottom translate-x-1 rotate-[24deg] sm:w-40 sm:translate-x-3 lg:w-48",
    ],
  },
  {
    id: "arc",
    stage: "flex items-end justify-center gap-3 sm:gap-8 lg:gap-12",
    icons: [
      "w-24 translate-y-5 -rotate-12 sm:w-36 lg:w-44",
      "z-10 w-32 -translate-y-3 sm:w-44 lg:w-52",
      "w-24 translate-y-5 rotate-12 sm:w-36 lg:w-44",
    ],
  },
  {
    id: "deck",
    stage: "relative mx-auto h-56 w-48 sm:h-72 sm:w-64 lg:h-80 lg:w-72",
    icons: [
      "absolute top-6 left-0 w-32 -rotate-[18deg] sm:w-44 lg:w-52",
      "absolute top-0 left-1/2 z-10 w-36 -translate-x-1/2 sm:w-48 lg:w-56",
      "absolute top-8 right-0 w-32 rotate-[16deg] sm:w-44 lg:w-52",
    ],
  },
] as const;

function AppIcon({
  icon,
  className,
}: {
  icon: (typeof ICONS)[number];
  className: string;
}) {
  return (
    <Image
      src={icon.src}
      alt={icon.alt}
      width={480}
      height={480}
      sizes="(max-width: 1024px) 40vw, 224px"
      className={cn(
        "h-auto [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.35))_drop-shadow(0_18px_16px_rgba(0,0,0,0.55))]",
        className,
      )}
    />
  );
}

export function HomeAppIconFans() {
  return (
    <>
      {FANS.map((fan) => (
        <section key={fan.id} className="bg-black px-5 py-20 sm:px-8 md:py-28">
          <Reveal className={cn("mx-auto max-w-screen-2xl", fan.stage)}>
            {ICONS.map((icon, index) => (
              <AppIcon key={icon.src} icon={icon} className={fan.icons[index]} />
            ))}
          </Reveal>
        </section>
      ))}
    </>
  );
}
