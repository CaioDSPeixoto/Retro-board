import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://caiopeixoto.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*/tools/finance/", "/*/admin/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
