import { HomeClients } from "@/components/features/marketing/HomeClients";
import { HomeCta } from "@/components/features/marketing/HomeCta";
import { HomeHero } from "@/components/features/marketing/HomeHero";
import { HomeMobile } from "@/components/features/marketing/HomeMobile";
import { HomeWebsites } from "@/components/features/marketing/HomeWebsites";

export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeWebsites />
      <HomeMobile />
      <HomeClients />
      <HomeCta />
    </>
  );
}
