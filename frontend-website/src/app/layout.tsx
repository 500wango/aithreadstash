'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";
import ExtensionAuth from "@/components/ExtensionAuth";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => {
      router.push('/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [router]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ExtensionAuth />
        {children}

        {/* Global dark footer - richer columns */}
        <footer id="site-global-footer" className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">AI ThreadStash</h3>
                <p className="text-gray-400">Intelligent conversation management for the AI era.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/features" className="hover:text-white">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>© {new Date().getFullYear()} AI ThreadStash. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Hide any page-level footers to avoid duplication */}
        <style jsx global>{`
          footer:not(#site-global-footer) { display: none !important; }
        `}</style>
      </body>
    </html>
  );
}
