import { ReviewNoise } from "@/components/features/marketing/ReviewNoise";
import { cn } from "@/lib/utils";

/**
 * Stand-in Google reviews for layout only.
 * Replace these with real reviews before the section is public.
 * Do not ship these names, quotes, or the sample rating.
 */
const PLACEHOLDER_REVIEWS = [
  {
    name: "Elena Vasquez",
    rating: 5,
    when: "3 weeks ago",
    text: "They understood the business before they touched the design. The site is clear, fast, and our customers can find what they need without asking us.",
  },
  {
    name: "Marcus Hale",
    rating: 5,
    when: "2 months ago",
    text: "We asked for an app people would actually open. The first version shipped on time, and it feels finished — not like a prototype we have to apologize for.",
  },
  {
    name: "Priya Nandakumar",
    rating: 5,
    when: "a month ago",
    text: "Straightforward from the first conversation through launch. They made the decisions easy and the work looks like it belongs to us.",
  },
] as const;

export function googleRatingSummary(reviews: readonly { rating: number }[]): {
  label: string;
  stars: number;
} {
  if (reviews.length === 0) return { label: "0.0", stars: 0 };

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return {
    label: average.toFixed(1),
    stars: Math.min(5, Math.max(0, Math.round(average))),
  };
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function StarRow({ rating, label }: { rating: number; label?: string }) {
  return (
    <div
      className="flex gap-0.5"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className={cn(
            "size-4",
            index < rating ? "text-[#FBBC04]" : "text-white/20",
          )}
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      ))}
    </div>
  );
}

export function HomeReviews() {
  const summary = googleRatingSummary(PLACEHOLDER_REVIEWS);

  return (
    <section
      aria-label="Reviews"
      className="relative overflow-hidden bg-black px-5 py-24 sm:px-8 md:py-32"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <ReviewNoise />
      </div>
      <div className="relative z-10 flex items-center justify-center gap-3">
        <GoogleMark className="size-7" />
        <p className="font-headline text-4xl font-bold tracking-tight text-white">
          <span className="sr-only">Rated </span>
          {summary.label}
          <span className="sr-only"> out of 5 on Google</span>
        </p>
        <StarRow rating={summary.stars} />
      </div>
      <div className="relative z-10 mx-auto mt-14 max-w-6xl">
        <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
          {PLACEHOLDER_REVIEWS.map((review) => (
            <li key={review.name}>
              <article className="h-full rounded-3xl border-4 border-white/40 bg-black/75 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/40 sm:p-8">
                <header className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="font-headline grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-medium text-white"
                    >
                      {initials(review.name)}
                    </span>
                    <div>
                      <p className="font-headline text-sm font-medium text-white">
                        {review.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StarRow
                          rating={review.rating}
                          label={`${review.rating} out of 5 stars`}
                        />
                        <span className="text-xs text-white/40">
                          {review.when}
                        </span>
                      </div>
                    </div>
                  </div>
                  <GoogleMark className="size-5 shrink-0" />
                </header>
                <blockquote className="text-on-surface mt-5 text-base leading-relaxed">
                  <p>{review.text}</p>
                </blockquote>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
