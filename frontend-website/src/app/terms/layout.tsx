import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Terms of Service | AI ThreadStash",
  description:
    "Read the Terms of Service for AI ThreadStash. Learn about account usage, acceptable use, payments, data handling, limitations of liability, and contact information.",
  alternates: {
    canonical: "https://aithreadstash.com/terms",
  },
  openGraph: {
    title: "Terms of Service | AI ThreadStash",
    description:
      "Read the Terms of Service for AI ThreadStash. Learn about account usage, acceptable use, payments, data handling, limitations of liability, and contact information.",
    url: "https://aithreadstash.com/terms",
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
    title: "Terms of Service | AI ThreadStash",
    description:
      "Read the Terms of Service for AI ThreadStash. Learn about account usage, acceptable use, payments, data handling, limitations of liability, and contact information.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}