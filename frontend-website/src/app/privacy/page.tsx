"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  save conversations, or contact us for support.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Account information (email, name)</li>
                  <li>Saved AI conversations and related metadata</li>
                  <li>Usage data and preferences</li>
                  <li>Payment information (processed securely through Stripe)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Improve our services and develop new features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Security</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Third-Party Services</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We use third-party services including:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Stripe for payment processing</li>
                  <li>Notion for optional data integration</li>
                  <li>Google and GitHub for authentication</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Rights</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your saved conversations</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  If you have any questions about this Privacy Policy, please contact us at:
                  <a href="mailto:privacy@aithreadstash.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    privacy@aithreadstash.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4 md:mb-0">
              AI ThreadStash
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-300">
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 font-semibold">Privacy</Link>
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</Link>
              <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}