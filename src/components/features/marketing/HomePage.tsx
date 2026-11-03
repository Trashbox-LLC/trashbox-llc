import { HomeClients } from "@/components/features/marketing/HomeClients";
import { HomeCta } from "@/components/features/marketing/HomeCta";
import { HomeHero } from "@/components/features/marketing/HomeHero";
import { HomeMobile } from "@/components/features/marketing/HomeMobile";
// import { HomeReviews } from "@/components/features/marketing/HomeReviews";
import { HomeStats } from "@/components/features/marketing/HomeStats";
import { HomeWebsites } from "@/components/features/marketing/HomeWebsites";

export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeClients />
      <HomeStats />
      <HomeWebsites />
      <HomeMobile />
      {/* Placeholder Google reviews. Uncomment when real reviews replace the stand-ins.
      <HomeReviews />
      */}
      <HomeCta />
    </>
  );
}
