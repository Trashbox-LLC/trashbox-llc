import { describe, expect, it } from "vitest";
import { FORM_PLANS } from "./form-plans";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_ORIGIN,
  absoluteUrl,
  crmJsonLd,
  indexablePaths,
  marketingMetadata,
  organizationJsonLd,
  portfolioJsonLd,
  robotsPolicy,
  serviceJsonLd,
} from "./seo";
import { PORTFOLIO_SITES } from "./portfolio";

describe("public site URLs", () => {
  it("uses the www host that production already redirects to", () => {
    expect(SITE_ORIGIN).toBe("https://www.trashbox.io");
    expect(absoluteUrl("/services/websites")).toBe(
      "https://www.trashbox.io/services/websites/",
    );
  });

  it("lists marketing and app pages and leaves the portal out", () => {
    const paths = indexablePaths();

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/about/",
        "/work/",
        "/services/",
        "/services/websites/",
        "/platform/",
        "/platform/pricing/",
        "/apps/bmplayer/privacy/",
        "/apps/calorietracker/privacy/",
      ]),
    );
    expect(paths.some((path) => path.startsWith("/portal"))).toBe(false);
  });
});

describe("marketing metadata", () => {
  it("sets a canonical URL and social tags for a public page", () => {
    const metadata = marketingMetadata({
      title: "Websites",
      description: "Launch sites.",
      path: "/services/websites",
    });

    expect(metadata.alternates).toEqual({
      canonical: "https://www.trashbox.io/services/websites/",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Websites",
      description: "Launch sites.",
      url: "https://www.trashbox.io/services/websites/",
    });
    expect(metadata.twitter).toMatchObject({
      title: "Websites",
      description: "Launch sites.",
    });
  });

  it("keeps the homepage title from picking up the site-name template", () => {
    const metadata = marketingMetadata({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      path: "/",
      absoluteTitle: true,
    });

    expect(metadata.title).toEqual({ absolute: HOME_TITLE });
    expect(HOME_DESCRIPTION).toMatch(/Kingwood/i);
  });
});

describe("robots policy", () => {
  it("points crawlers at the sitemap and blocks the portal", () => {
    expect(robotsPolicy()).toEqual({
      allow: "/",
      disallow: ["/portal"],
      sitemap: "https://www.trashbox.io/sitemap.xml",
    });
  });
});

describe("structured data", () => {
  it("describes the studio from published business details", () => {
    const data = organizationJsonLd();

    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("Trashbox LLC");
    expect(data.url).toBe("https://www.trashbox.io/");
    expect(data.address).toMatchObject({
      addressLocality: "Kingwood",
      addressRegion: "TX",
    });
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
  });

  it("describes a service page without inventing offers", () => {
    const data = serviceJsonLd({
      name: "Websites",
      description: "Launch sites.",
      path: "/services/websites",
    });

    expect(data["@type"]).toBe("Service");
    expect(data.url).toBe("https://www.trashbox.io/services/websites/");
    expect(data).not.toHaveProperty("offers");
  });

  it("lists the built websites without inventing reviews", () => {
    const data = portfolioJsonLd(PORTFOLIO_SITES);

    expect(data["@type"]).toBe("CollectionPage");
    expect(data.url).toBe("https://www.trashbox.io/work/");
    expect(data.mainEntity.itemListElement.map((item) => item.url)).toEqual(
      PORTFOLIO_SITES.map((site) => site.href),
    );
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
  });

  it("lists the published CRM plan prices", () => {
    const data = crmJsonLd();
    const prices = data.offers.map((offer) => Number(offer.price));

    expect(data.name).toBe("Trashbox CRM");
    expect(prices).toEqual(FORM_PLANS.map((plan) => plan.price));
    expect(data.offers.every((offer) => offer.priceCurrency === "USD")).toBe(
      true,
    );
  });
});
