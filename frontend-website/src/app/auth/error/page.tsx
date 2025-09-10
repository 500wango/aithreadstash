"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function AuthError() {
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message) {
      setErrorMessage(decodeURIComponent(message));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Logo />
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
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Authentication Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                There was a problem signing you in.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                <p className="text-red-800 dark:text-red-200 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-3">
              <a
                href="/login"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
              >
                Back to Login
              </a>
              <Link
                href="/"
                className="w-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors block text-center"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}