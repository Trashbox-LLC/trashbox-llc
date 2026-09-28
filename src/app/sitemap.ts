import type { MetadataRoute } from "next";
import { absoluteUrl, indexablePaths } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePaths().map((path) => ({
    url: absoluteUrl(path),
  }));
}
