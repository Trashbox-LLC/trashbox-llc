import { WorkCarousel } from "@/components/features/marketing/WorkCarousel";

export function WorkPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col pt-24 pb-8 md:pt-28">
      <h1 className="font-headline mb-6 shrink-0 text-center text-sm font-bold tracking-[0.45em] text-white uppercase">
        Work
      </h1>
      <WorkCarousel />
    </div>
  );
}
