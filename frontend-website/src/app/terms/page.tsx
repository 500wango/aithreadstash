"use client";
import Link from 'next/link';
import Navbar from "@/components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Acceptance of Terms</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  By accessing and using AI ThreadStash, you accept and agree to be bound by the terms 
                  and provision of this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description of Service</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  AI ThreadStash is a service that allows users to save, organize, and manage their 
                  AI conversations from various platforms. We provide:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Browser extension for capturing AI conversations</li>
                  <li>Web dashboard for managing saved conversations</li>
                  <li>Integration with third-party services like Notion</li>
                  <li>Cloud storage and synchronization</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Accounts</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  To use our service, you must:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Acceptable Use</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You agree not to use the service to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Upload malicious code or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service for any illegal or unauthorized purpose</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment and Billing</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  For paid subscriptions:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Payments are processed securely through Stripe</li>
                  <li>Subscriptions renew automatically unless cancelled</li>
                  <li>Refunds are handled according to our refund policy</li>
                  <li>Price changes will be communicated in advance</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data and Privacy</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your data belongs to you. We:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Store your conversations securely</li>
                  <li>Do not sell or share your personal data</li>
                  <li>Allow you to export or delete your data</li>
                  <li>Follow our Privacy Policy for data handling</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Service Availability</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We strive to maintain high service availability but cannot guarantee 100% uptime. 
                  We reserve the right to modify or discontinue the service with reasonable notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Limitation of Liability</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  AI ThreadStash shall not be liable for any indirect, incidental, special, or 
                  consequential damages arising from your use of the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Termination</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Either party may terminate this agreement at any time. Upon termination, 
                  your access to the service will cease, and you may request data export.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Changes to Terms</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We may update these terms from time to time. We will notify users of any 
                  material changes via email or through the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  If you have questions about these Terms of Service, please contact us at:
                  <a href="mailto:legal@aithreadstash.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    legal@aithreadstash.com
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
              <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</Link>
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 font-semibold">Terms</Link>
              <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}