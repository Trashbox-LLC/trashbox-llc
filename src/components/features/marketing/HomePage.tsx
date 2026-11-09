import { HomeAppIconFans } from "@/components/features/marketing/HomeAppIconFans";
import { HomeClients } from "@/components/features/marketing/HomeClients";
import { HomeCoverHero } from "@/components/features/marketing/HomeCoverHero";
import { HomeCta } from "@/components/features/marketing/HomeCta";
import { HomeHero } from "@/components/features/marketing/HomeHero";
import { HomeMobile } from "@/components/features/marketing/HomeMobile";
// import { HomeReviews } from "@/components/features/marketing/HomeReviews";
import { HomeStats } from "@/components/features/marketing/HomeStats";
import { HomeWebsites } from "@/components/features/marketing/HomeWebsites";

export function HomePage({ hero = "cover" }: { hero?: "devices" | "cover" }) {
  return (
    <>
      {hero === "cover" ? <HomeCoverHero /> : <HomeHero />}
      <HomeClients />
      <HomeStats />
      <HomeWebsites />
      <HomeMobile />
      <HomeAppIconFans />
      {/* Placeholder Google reviews. Uncomment when real reviews replace the stand-ins.
      <HomeReviews />
      */}
      <HomeCta />
    </>
  );
}
