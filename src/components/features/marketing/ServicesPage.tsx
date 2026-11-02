import Link from "next/link";
import { FadeIn } from "@/components/atoms/FadeIn";
import { Reveal } from "@/components/atoms/Reveal";
import { ReadyWhenYouAre } from "@/components/features/marketing/ReadyWhenYouAre";
import { SERVICE_OFFERINGS } from "@/components/features/marketing/service-offerings";
import { SERVICE_PATHS } from "@/lib/sites";

export function ServicesPage() {
  return (
    <>
      <div className="mx-auto max-w-screen-2xl px-8 pt-32 pb-24">
        <header className="mb-24 md:mb-32">
          <FadeIn>
            <p className="font-label text-outline mb-6 text-xs tracking-[0.4em] uppercase">
              Services
            </p>
            <h1 className="font-headline max-w-4xl text-6xl leading-tight font-bold tracking-tighter text-white md:text-8xl">
              Build once.
              <br />
              <span className="text-outline">Or keep building.</span>
            </h1>
            <p className="text-on-surface-variant mt-8 max-w-2xl text-lg leading-relaxed md:text-xl">
              One-off websites and apps when you need a clear finish line.
              Ongoing development when the product—or the business—keeps moving.
            </p>
          </FadeIn>
        </header>

        <section className="space-y-16">
          {SERVICE_OFFERINGS.map((offering, index) => (
            <Reveal
              key={offering.slug}
              fade
              delay={index * 0.04}
              className="border-outline-variant/10 grid grid-cols-1 items-start gap-6 border-t pt-10 lg:grid-cols-12 lg:gap-12"
            >
              <div className="lg:col-span-4">
                <p className="font-label text-primary/40 text-[10px] tracking-[0.3em] uppercase">
                  {offering.eyebrow}
                </p>
                <h2 className="font-headline mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  <Link
                    href={SERVICE_PATHS[offering.slug]}
                    className="hover:text-outline transition-colors"
                  >
                    {offering.title}
                  </Link>
                </h2>
              </div>
              <div className="lg:col-span-8">
                <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
                  {offering.intro}
                </p>
                <Link
                  href={SERVICE_PATHS[offering.slug]}
                  className="font-headline text-primary mt-6 inline-block text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
                >
                  View {offering.title}
                </Link>
              </div>
            </Reveal>
          ))}
        </section>
      </div>
      <ReadyWhenYouAre />
    </>
  );
}
