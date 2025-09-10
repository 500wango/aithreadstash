import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | AI ThreadStash",
  description:
    "Read the Privacy Policy for AI ThreadStash. Learn what data we collect, how we use it, third-party processors, security measures, and your rights.",
  alternates: {
    canonical: "https://aithreadstash.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | AI ThreadStash",
    description:
      "Read the Privacy Policy for AI ThreadStash. Learn what data we collect, how we use it, third-party processors, security measures, and your rights.",
    url: "https://aithreadstash.com/privacy",
    siteName: "AI ThreadStash",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "AI ThreadStash",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | AI ThreadStash",
    description:
      "Read the Privacy Policy for AI ThreadStash. Learn what data we collect, how we use it, third-party processors, security measures, and your rights.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}