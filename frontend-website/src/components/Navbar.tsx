'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiService } from '@/lib/api';
import Logo from './Logo';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await ApiService.isAuthenticated();
        setIsAuthenticated(authStatus);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    // Trigger auth change event for other components
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Logo />
          </div>
          <div className="flex gap-3">
            <div className="w-20 h-10 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="container mx-auto px-4 py-6">
      <nav className="flex justify-between items-center">
        {/* Brand */}
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          <Logo />
        </div>

        {/* Main Nav */}
        <div className="hidden md:flex items-center gap-6 text-gray-700 dark:text-gray-300">
          <Link href="/">Home</Link>
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
        </div>

        {/* Auth Actions */}
        <div className="flex gap-3">
          {isAuthenticated ? (
            <>
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
                className="px-4 py-2 rounded-md border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-md border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}