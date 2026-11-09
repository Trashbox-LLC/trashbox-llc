import { HomeAppIconFans } from "@/components/features/marketing/HomeAppIconFans";
import { HomeClients } from "@/components/features/marketing/HomeClients";
import { HomeCoverHero } from "@/components/features/marketing/HomeCoverHero";
import { HomeCta } from "@/components/features/marketing/HomeCta";
import { HomeHero } from "@/components/features/marketing/HomeHero";
import { HomeMobile } from "@/components/features/marketing/HomeMobile";
// import { HomeReviews } from "@/components/features/marketing/HomeReviews";
import { HomeStats } from "@/components/features/marketing/HomeStats";
import { HomeWebsites } from "@/components/features/marketing/HomeWebsites";
import { DEFAULT_HERO_COVER_ID } from "@/components/features/marketing/hero-covers";
import {
  DEFAULT_KICKER_SETTINGS,
  type HomeHeadline,
  type HomeKickerSettings,
} from "@/components/features/marketing/home-dev-settings";

export function HomePage({
  hero = "cover",
  headline = "gradient",
  coverId = DEFAULT_HERO_COVER_ID,
  kicker = DEFAULT_KICKER_SETTINGS,
}: {
  hero?: "devices" | "cover";
  headline?: HomeHeadline;
  coverId?: string;
  kicker?: HomeKickerSettings;
}) {
  return (
    <>
      {hero === "cover" ? (
        <HomeCoverHero headline={headline} coverId={coverId} kicker={kicker} />
      ) : (
        <HomeHero />
      )}
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
