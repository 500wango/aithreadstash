"use client";

import { useState, useEffect } from "react";
import { ApiService } from "@/lib/api";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function BillingPortal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ApiService.isAuthenticated()) {
      window.location.href = "/login";
    }
  }, []);

  const handlePortalSession = async () => {
    try {
      setIsLoading(true);
      setError("");

      const returnUrl = `${window.location.origin}/dashboard`;
      const session = await ApiService.createStripePortalSession(returnUrl);
      window.location.href = session.url;
    } catch (err: unknown) {
      logger.error("Portal session error:", err);
      const status = typeof err === "object" && err !== null && "status" in err ? (err as { status?: number }).status : undefined;
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to access billing portal';

      if (status === 400 && /No active subscription found/i.test(String(message))) {
        setError("You don't have an active subscription yet. Upgrade to Pro to manage billing.");
        return;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Link href="/">Aithreadstash</Link>
          </div>
          <div className="hidden md:flex items-center gap-6 text-gray-700 dark:text-gray-300">
            <Link href="/">Home</Link>
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Billing Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Manage your subscription, update payment methods, and view billing history
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <button
                  onClick={handlePortalSession}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Manage Billing in Customer Portal'
                  )}
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">What you can do in the portal:</h3>
                <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                  <li>• Update your payment method</li>
                  <li>• View and download invoices</li>
                  <li>• Change your subscription plan</li>
                  <li>• Cancel your subscription</li>
                  <li>• Update billing information</li>
                </ul>
              </div>

              <div className="text-center pt-6 border-t border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need help with billing?{' '}
                  <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Contact support
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}