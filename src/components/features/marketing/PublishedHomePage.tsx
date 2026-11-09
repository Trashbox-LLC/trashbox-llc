import { HomeCta } from "@/components/features/marketing/HomeCta";
import { PublishedHomeHero } from "@/components/features/marketing/PublishedHomeHero";

/** Homepage composition currently published on main. */
export function PublishedHomePage() {
  return (
    <>
      <PublishedHomeHero />
      <HomeCta />
    </>
  );
}
