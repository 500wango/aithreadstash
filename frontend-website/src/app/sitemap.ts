import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || "https://aithreadstash.com";
  return env.replace(/\/+$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();

  const routes = [
    "/",
    "/features",
    "/pricing",
    "/faq",
    "/privacy",
    "/terms",
    "/contact",
    "/login",
    "/register",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}