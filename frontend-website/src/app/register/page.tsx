"use client";

import { useState, useEffect } from "react";
import { ApiService, API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import Logo from "@/components/Logo";
import { logger } from "@/lib/logger";

type OAuthStatus = { available: boolean; message?: string; error?: string };

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleOAuthStatus, setGoogleOAuthStatus] = useState<OAuthStatus | null>(null);
  const [isCheckingGoogleStatus, setIsCheckingGoogleStatus] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await ApiService.register({ name, email, password });
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查Google OAuth状态
  useEffect(() => {
    const checkGoogleOAuthStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/google/status`);
        const status: OAuthStatus = await response.json();
        setGoogleOAuthStatus(status);
      } catch (error) {
        logger.error('Failed to check Google OAuth status:', error);
        setGoogleOAuthStatus({
          available: false,
          error: 'CONNECTION_ERROR',
          message: 'Unable to check Google OAuth status'
        });
      } finally {
        setIsCheckingGoogleStatus(false);
      }
    };

    checkGoogleOAuthStatus();
  }, []);

  const handleGoogleLogin = () => {
    // 检查Google OAuth是否可用
    if (!googleOAuthStatus?.available) {
      setError(googleOAuthStatus?.message || 'Google OAuth service is temporarily unavailable');
      return;
    }

    const googleAuthUrl = `${API_BASE_URL}/auth/google`;
    const popup = window.open(
      googleAuthUrl,
      "google-auth",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    // Listen for messages from the popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data.type === 'AUTH_SUCCESS' && event.data.token) {
        // Store the token and redirect to dashboard
        ApiService.setAuthToken(event.data.token);
        // Persist refresh token if provided by popup
        if (event.data.refreshToken) {
          try {
            localStorage.setItem('refreshToken', event.data.refreshToken);
            sessionStorage.setItem('refreshToken', event.data.refreshToken);
          } catch {}
        }
        window.removeEventListener('message', messageListener);
        window.location.href = '/dashboard';
      }
    };
    
    window.addEventListener('message', messageListener);

    // Fallback: Listen for the popup to close
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        // Check if authentication was successful by trying to get user info
        window.location.reload();
      }
    }, 1000);
  };

  const handleGithubLogin = () => {
    const githubAuthUrl = `${API_BASE_URL}/auth/github`;
    const popup = window.open(
      githubAuthUrl,
      "github-auth",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    // Listen for messages from the popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data.type === 'AUTH_SUCCESS' && event.data.token) {
        // Store the token and redirect to dashboard
        ApiService.setAuthToken(event.data.token);
        window.removeEventListener('message', messageListener);
        window.location.href = '/dashboard';
      }
    };
    
    window.addEventListener('message', messageListener);

    // Fallback: Listen for the popup to close
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        // Check if authentication was successful by trying to get user info
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
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
          <div className="flex gap-4">
            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Login
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Create Your Account
            </h1>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="John Doe"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isCheckingGoogleStatus || !googleOAuthStatus?.available}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium transition-colors ${
                    isCheckingGoogleStatus || !googleOAuthStatus?.available
                      ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                  title={!googleOAuthStatus?.available ? googleOAuthStatus?.message : ''}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                <button
                  onClick={handleGithubLogin}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Sign in
              </Link>
            </p>
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