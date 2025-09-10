"use client";

import { useState, useEffect, type ChangeEvent, useRef } from "react";
import { ApiService, User } from "@/lib/api";
import Link from 'next/link';
import Logo from "@/components/Logo";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // Browser extension connection status (null = unknown/loading)
  const [extConnected, setExtConnected] = useState<boolean>(false);
  const [extVersion, setExtVersion] = useState<string | null>(null);
  // 手动导入状态
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("No file selected");

  useEffect(() => {
    // Removed dev-only bypass so the page reflects real auth status and trial state from backend
    
    if (!ApiService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await ApiService.getCurrentUser();
      setUser(userData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Probe for browser extension connection via window.postMessage handshake
  useEffect(() => {
    let cancelled = false;
    let settled = false;

    function handleMessage(event: MessageEvent) {
      try {
        // Only accept same-origin messages
        if (event.origin !== window.location.origin) return;
        const data = event.data as unknown;
        if (!data || typeof data !== 'object') return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((data as any).type === 'ATS_EXTENSION_PONG') {
          settled = true;
          if (!cancelled) {
            setExtConnected(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((data as any).version && typeof (data as any).version === 'string') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setExtVersion('v' + (data as any).version);
            }
          }
          window.removeEventListener('message', handleMessage);
        }
      } catch {
        // ignore
      }
    }

    try {
      window.addEventListener('message', handleMessage);

      // Send ping to content script bridge; expect PONG in ~<1s
      const target = window.location.origin;
      // Fire a couple of pings to improve reliability
      window.postMessage({ type: 'ATS_EXTENSION_PING' }, target);
      const retry1 = setTimeout(() => {
        if (!settled) window.postMessage({ type: 'ATS_EXTENSION_PING' }, target);
      }, 400);

      const timeout = setTimeout(() => {
        if (!cancelled && !settled) {
          setExtConnected(false);
        }
      }, 1500);

      return () => {
        cancelled = true;
        window.removeEventListener('message', handleMessage);
        clearTimeout(timeout);
        clearTimeout(retry1);
      };
    } catch {
      if (!cancelled) setExtConnected(false);
      return () => {
        cancelled = true;
        window.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    window.location.href = "/";
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName("No file selected");
      return;
    }
    setImporting(true);
    setImportMsg(null);
    setImportErr(null);
    try {
      setSelectedFileName(file.name);
      const text = await file.text();
      const data = JSON.parse(text);
      const added = ApiService.importConversations(data);
      setImportMsg(`Imported ${added} conversations`);
      setImportJson("");
    } catch (e: unknown) {
      setImportErr(e instanceof Error ? e.message : 'Import failed, please check the JSON format');
    } finally {
      setImporting(false);
      // Clear file input value so user can re-select the same file
      if (e.target) (e.target as HTMLInputElement).value = "";
      setSelectedFileName("No file selected");
    }
  };

  // Manual import: paste JSON content
  const onPasteImport = async () => {
    if (!importJson.trim()) return;
    setImporting(true);
    setImportMsg(null);
    setImportErr(null);
    try {
      const data = JSON.parse(importJson);
      const added = ApiService.importConversations(data);
      setImportMsg(`Imported ${added} conversations`);
      setImportJson("");
    } catch (e: unknown) {
      setImportErr(e instanceof Error ? e.message : 'Import failed, please check the JSON format');
    } finally {
      setImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

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
            <Link href="/settings" className="text-blue-600 dark:text-blue-400 font-semibold">
              Settings
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Account Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{user?.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subscription
                    </label>
                    {(() => {
                      const pro = user?.subscriptionStatus === 'pro' || !!user?.onTrial;
                      const label = user?.subscriptionStatus === 'pro' ? 'Pro' : (user?.onTrial ? 'Pro (Trial)' : 'Free');
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          pro
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {label}
                        </span>
                      );
                    })()}
                    {/* spacer */}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Integrations */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integrations</h2>
                
                <div className="space-y-4">
                  {/* Notion Integration Card */}
                  <Link
                    href="/settings/notion"
                    className="block p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">Notion</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Save conversations directly to Notion
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>

                  {/* Google Drive Integration Card */}
                  <Link
                    href="/settings/google-drive"
                    className="block p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12.87 3.5l5.63 9.75-3.25 5.63H7.38L4.13 13.25 7.38 7.5h5.49l-2.75-4zM8.5 9l-2.25 4 2.25 4h7l2.25-4-2.25-4h-7z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">Google Drive</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Export conversations as Google Docs into your Drive
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>

                  {/* More integrations can be added here */}
                  <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg opacity-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-500 dark:text-gray-400">Slack</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Coming soon
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg opacity-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-500 dark:text-gray-400">Discord</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">App Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive email updates about your account
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Browser Extension */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700" data-testid="browser-extension">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Browser Extension</h2>
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Extension Status</p>
                  <p className={`mt-1 font-medium ${extConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`} data-testid="extension-status">
                    {extConnected ? 'Extension Connected' : 'Extension Not Connected'}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {extVersion ?? 'v0.2.x'}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 dark:text-white">Install the browser extension</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Capture and export AI conversations from ChatGPT, Claude, DeepSeek, and Gemini with one click.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <a className="text-blue-600 dark:text-blue-400 hover:underline" href="#" target="_blank" rel="noreferrer">Chrome Web Store</a>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 dark:text-white">Supported Platforms</h3>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                  <li>ChatGPT</li>
                  <li>Claude</li>
                  <li>DeepSeek</li>
                  <li>Gemini</li>
                </ul>
              </div>

              {/* Manual Import */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-900 dark:text-white">Manual Import</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Import conversation data from an exported JSON file or pasted JSON. Data is only stored in your browser (localStorage) and is not uploaded to the server.
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Choose JSON file</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={onFileChange}
                      disabled={importing}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700"
                      >
                        Select file
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedFileName}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Or paste JSON content</label>
                    <textarea
                      rows={6}
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder='{"conversations": [ {"title": "...", "messages": [...] } ]}'
                    />
                    <button
                      onClick={onPasteImport}
                      disabled={importing || !importJson.trim()}
                      className="mt-2 px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60 hover:bg-green-700"
                    >
                      {importing ? 'Importing...' : 'Import JSON'}
                    </button>
                  </div>

                  {importMsg && (
                    <div className="p-3 rounded bg-green-100 text-green-700 border border-green-300">
                      {importMsg}
                      <Link href="/conversations" className="underline ml-2 text-green-700">View conversations</Link>
                    </div>
                  )}

                  {importErr && (
                    <div className="p-3 rounded bg-red-100 text-red-700 border border-red-300">
                      {importErr}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy & Data</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We value your privacy. Manage your data preferences and learn how your information is used.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}