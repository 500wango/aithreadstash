import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || "https://aithreadstash.com";
  return env.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  const indexingEnabled = process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true";

  if (!indexingEnabled) {
    // Before official launch: block all crawlers
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  // After launch: allow crawling and expose sitemap
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}