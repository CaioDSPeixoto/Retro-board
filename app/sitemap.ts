import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://caiopeixoto.dev";
const locales = ["pt", "en", "es"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/cv",
    "/tools",
    "/tools/retroboard",
    "/tools/todo",
    "/tools/time-tracker",
    "/releases",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1.0 : route === "/cv" ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
