"use client";

import { useState, useEffect } from "react";
import { ApiService, User } from "@/lib/api";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const maybeSyncAfterCheckout = async () => {
      // Check for checkout success
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('checkout') === 'success') {
        setShowSuccess(true);
        try {
          setIsLoading(true);
          const attempts = 3;
          const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

          for (let i = 0; i < attempts; i++) {
            await ApiService.syncSubscription();
            const updatedUser = await ApiService.getCurrentUser();
            setUser(updatedUser);
            if (updatedUser?.subscriptionStatus === 'pro') {
              break; // already upgraded to pro, stop early
            }
            if (i < attempts - 1) {
              await delay(2000); // wait 2 seconds then retry
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : typeof err === 'string' ? err : "Failed to sync subscription";
          setError(message);
        } finally {
          // Remove the query parameter from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
        }
      }
    };

    maybeSyncAfterCheckout();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!ApiService.isAuthenticated()) {
        window.location.href = "/login";
        return;
      }

      try {
        const userData = await ApiService.getCurrentUser();
        setUser(userData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : typeof err === 'string' ? err : "Failed to load user data";
        setError(message);
        // Only redirect to login for unauthorized; do not clear tokens here
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          window.location.href = "/login";
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "User not found"}</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Ensure user has required properties with default values
  const safeUser = {
    ...user,
    subscriptionStatus: user.subscriptionStatus || 'free',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || ''
  };

  const isPro = safeUser.subscriptionStatus === "pro" || !!safeUser.onTrial;
  const userUsage = {
    conversations: isPro ? 127 : 42,
    storage: isPro ? 2.3 : 0.8,
    limit: isPro ? 1000 : 100
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Logo />
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Dashboard
            </Link>
            <Link href="/conversations" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Conversations
            </Link>
            <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Settings
            </Link>
            <button 
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {showSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 dark:text-green-200">
                  Subscription successfully activated! Welcome to Pro plan.
                </p>
              </div>
            </div>
          )}
         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
           <div className="flex items-start gap-2 text-sm">
             <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
             </svg>
             <p className="text-blue-800 dark:text-blue-200">
               Conversation content is strictly stored in your local browser and is not uploaded to the server. You can clear or export local conversations on the Settings page.
               <Link href="/settings" className="ml-2 underline hover:text-blue-700 dark:hover:text-blue-300">View Settings &gt; Privacy &amp; Data</Link>
             </p>
           </div>
         </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {safeUser.firstName || safeUser.email}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {safeUser.email}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isPro 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Subscription Details
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Plan:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{isPro ? 'Pro' : 'Free'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isPro 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {isPro ? 'active' : 'free'}
                  </span>
                </div>
                
                {isPro && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Next Billing:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {isPro ? (
                  <>
                    <Link
                      href="/billing"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
                    >
                      Manage Subscription
                    </Link>
                    <Link
                      href="/billing"
                      className="w-full border border-red-300 text-red-600 dark:text-red-400 py-2 px-4 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors block text-center"
                    >
                      Cancel Subscription
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/pricing"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Usage Statistics
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Conversations Saved</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userUsage.conversations} / {userUsage.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(userUsage.conversations / userUsage.limit) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Storage Used</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userUsage.storage} MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(userUsage.storage / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {!isPro && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    Upgrade to Pro for unlimited conversations and advanced features.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/export"
                className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Export Data</span>
              </a>

              <a
                href="/settings"
                className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Settings</span>
              </a>

              <a
                href="/help"
                className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Help Center</span>
              </a>
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
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</Link>
              <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}