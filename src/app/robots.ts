import type { MetadataRoute } from "next";
import { robotsPolicy } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const policy = robotsPolicy();

  return {
    rules: {
      userAgent: "*",
      allow: policy.allow,
      disallow: policy.disallow,
    },
    sitemap: policy.sitemap,
  };
}
