"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ApiService } from "@/lib/api";
import type React from 'react'
import Navbar from "@/components/Navbar";
import { logger } from "@/lib/logger";

export default function Pricing() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    try {
      setIsLoading(priceId);
      const origin = window.location.origin;
      const successUrl = `${origin}/dashboard?checkout=success`;
      const cancelUrl = `${origin}/pricing`;
      const session = await ApiService.createStripeCheckoutSession(priceId, successUrl, cancelUrl);
      window.location.href = session.url;
    } catch (e) {
      logger.error('Checkout failed:', e);
       alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleFreeTrial = async () => {
    if (ApiService.isAuthenticated()) {
      window.location.href = "/dashboard";
      return;
    }
    window.location.href = "/register";
  };


  // Waitlist email capture state and analytics
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistName, setWaitlistName] = useState('');

  const trackWaitlistClick = () => {
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void; plausible?: (...args: unknown[]) => void };
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'click', {
          event_category: 'cta',
          event_label: 'pricing_ultimate_waitlist',
          transport_type: 'beacon',
        });
      }
      if (typeof w.plausible === 'function') {
        w.plausible('Join Waitlist Click', { props: { plan: 'Ultimate', location: 'pricing' } });
      }
    } catch {}
  };

  const trackWaitlistSubmit = () => {
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void; plausible?: (...args: unknown[]) => void };
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'generate_lead', {
          event_category: 'lead',
          event_label: 'ultimate_waitlist',
          transport_type: 'beacon',
        });
      }
      if (typeof w.plausible === 'function') {
        w.plausible('Join Waitlist Submitted', { props: { plan: 'Ultimate', location: 'pricing' } });
      }
    } catch {}
  };

  const closeWaitlistModal = () => {
    setShowWaitlistModal(false);
    setWaitlistError(null);
    setWaitlistSubmitting(false);
    setWaitlistSuccess(false);
    setWaitlistName('');
    setWaitlistEmail('');
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWaitlistModal();
    };
    if (showWaitlistModal) {
      document.addEventListener('keydown', onEsc);
    }
    return () => {
      document.removeEventListener('keydown', onEsc);
    };
  }, [showWaitlistModal]);

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);
    const email = waitlistEmail.trim();
    const name = waitlistName.trim();
    // Basic validation
    if (name.length < 2) {
      setWaitlistError('Please enter your name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }
    setWaitlistSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, plan: 'Ultimate', source: 'pricing' }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setWaitlistSuccess(true);
      setWaitlistEmail('');
      setWaitlistName('');
      trackWaitlistSubmit();
    } catch {
      setWaitlistError('Something went wrong. Please try again later.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <section className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Choose the plan that works best for your needs. All plans include our core features.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h2>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">$0</div>
              <div className="text-gray-600 dark:text-gray-300">forever</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Basic conversation capture
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Local storage only
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Basic formatting options
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Community support
              </li>
            </ul>

            <button
              onClick={handleFreeTrial}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Started Free
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border-2 border-blue-500 dark:border-blue-400 relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
              Popular
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h2>
              <div className="flex items-center justify-center mb-2">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">$5</div>
                <div className="text-gray-600 dark:text-gray-300 ml-2">/month</div>
              </div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                Save 20% with annual billing ($48/year)
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Everything in Free, plus:
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Notion integration
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cloud sync & backup
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced formatting options
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Export to multiple formats
              </li>
            </ul>

            <div className="space-y-3">
              <button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_monthly_test_id')}
                disabled={isLoading === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Start Free Trial - Monthly'
                )}
              </button>
              
              <button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'price_yearly_test_id')}
                disabled={isLoading === process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Start Free Trial - Yearly'
                )}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border-2 border-purple-500 dark:border-purple-400 relative">
            <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
              Coming Soon
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ultimate</h2>
              <div className="flex items-center justify-center mb-2">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">$10</div>
                <div className="text-gray-600 dark:text-gray-300 ml-2">/month</div>
              </div>
              <div className="text-purple-600 dark:text-purple-400 font-semibold">
                Perplexity + Slack, and more
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All Pro features
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Perplexity integration
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                One-click export to Slack
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Team workspace & advanced permissions
              </li>
            </ul>


            <button
              onClick={() => { setShowWaitlistModal(true); trackWaitlistClick(); }}
              className="w-full inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        </section>

        {/* Waitlist Modal */}
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
              <button onClick={closeWaitlistModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Join the Ultimate Plan Waitlist</h3>

              {waitlistSuccess ? (
                <div className="text-green-600 dark:text-green-400">
                  Thanks for joining the waitlist! We'll notify you when the Ultimate plan is available.
                </div>
              ) : (
                <form onSubmit={submitWaitlist} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  {waitlistError && (
                    <div className="text-red-600 dark:text-red-400 text-sm">{waitlistError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="w-full inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {waitlistSubmitting ? 'Submitting...' : 'Join Waitlist'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is there a free trial?</h3>
              <p className="text-gray-700 dark:text-gray-300">Yes! Pro plans include a 7-day free trial with full access to all features.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I switch plans anytime?</h3>
              <p className="text-gray-700 dark:text-gray-300">Yes, you can change between monthly and yearly billing at any time from your billing portal.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-700 dark:text-gray-300">We accept major credit and debit cards via Stripe.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens at the end of the trial?</h3>
              <p className="text-gray-700 dark:text-gray-300">You'll be able to choose a subscription to keep Pro features. If you don't subscribe, you'll still be able to access your content with Free features.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-700 dark:text-gray-300">Absolutely. You can manage your subscription from the billing portal at any time.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-300">
          <div className="mb-2">© {new Date().getFullYear()} AI ThreadStash. All rights reserved.</div>
          <div className="space-x-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}