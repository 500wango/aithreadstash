"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiService, NotionStatus, NotionDatabase } from "@/lib/api";
import Link from 'next/link';
import Logo from "@/components/Logo";

export default function NotionSettings() {
  const [status, setStatus] = useState<NotionStatus | null>(null);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const extractMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const anyErr = err as { message?: unknown };
      if (typeof anyErr.message === 'string') return anyErr.message;
    }
    return fallback;
  };

  const loadDatabases = useCallback(async () => {
    try {
      const response = await ApiService.getNotionDatabases();
      setDatabases(response.databases);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to load databases"));
    }
  }, []);

  const loadNotionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getNotionStatus();
      setStatus(response.status);
      if (response.status.connected) {
        await loadDatabases();
      }
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to load Notion status"));
    } finally {
      setIsLoading(false);
    }
  }, [loadDatabases]);

  useEffect(() => {
    if (!ApiService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    loadNotionStatus();
  }, [loadNotionStatus]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await ApiService.getNotionOAuthUrl();
      
      // 使用弹窗模式打开Notion OAuth
      const popup = window.open(
        response.url,
        'notion-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        setError('Popup was blocked, please allow popups and try again');
        return;
      }

      // 监听来自弹窗的消息
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'NOTION_AUTH_SUCCESS') {
          popup.close();
          window.removeEventListener('message', messageListener);
          setSuccess(`Notion connected successfully! Workspace: ${event.data.workspaceName}`);
          loadNotionStatus();
          if (status?.connected) {
            loadDatabases();
          }
        } else if (event.data.type === 'NOTION_AUTH_CANCELLED') {
          popup.close();
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

      // 检查弹窗是否被关闭（用户手动关闭）
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to start Notion connection"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect from Notion? This will remove your access token and selected database.")) {
      return;
    }

    try {
      await ApiService.disconnectNotion();
      setStatus({
        connected: false,
        databaseSelected: false,
      });
      setDatabases([]);
      setSelectedDatabase("");
      setSuccess("Successfully disconnected from Notion");
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to disconnect from Notion"));
    }
  };

  const handleDatabaseSelect = async (databaseId: string) => {
    try {
      await ApiService.selectNotionDatabase(databaseId);
      setSelectedDatabase(databaseId);
      setSuccess("Database selected successfully");
      
      // Reload status
      setTimeout(loadNotionStatus, 1000);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to select database"));
    }
  };

  const handleSaveToNotion = async () => {
    try {
      setError("");
      setSuccess("");
      
      const testData = {
        title: "Test Conversation - " + new Date().toLocaleString(),
        content: "This is a test conversation saved from AI ThreadStash settings page. If you can see this, your Notion integration is working correctly!",
        summary: "Test conversation to verify Notion integration",
        tags: "test,integration,aithreadstash"
      };
      
      const result = await ApiService.saveToNotion(testData);
      setSuccess(`Successfully saved to Notion! Page URL: ${result.url}`);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to save to Notion"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Notion settings...</p>
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
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notion Integration</h1>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
                <p className="text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Connection Status */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connection Status</h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status?.connected 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                    }`} />
                    <span className="text-gray-700 dark:text-gray-300">
                      {status?.connected ? 'Connected to Notion' : 'Not connected'}
                    </span>
                    {status?.workspaceName && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        ({status.workspaceName})
                      </span>
                    )}
                  </div>
                  
                  {status?.connected ? (
                    <button
                      onClick={handleDisconnect}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect to Notion'}
                    </button>
                  )}
                </div>
              </div>

              {/* Database Selection */}
              {status?.connected && (
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Selection</h2>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        status.databaseSelected 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`} />
                      <span className="text-gray-700 dark:text-gray-300">
                        {status.databaseSelected ? 'Database selected' : 'No database selected'}
                      </span>
                    </div>
                    
                    <button
                      onClick={loadDatabases}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                    >
                      Refresh Databases
                    </button>
                  </div>

                  {databases.length > 0 ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select a database:
                      </label>
                      <select
                        value={selectedDatabase}
                        onChange={(e) => handleDatabaseSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Choose a database...</option>
                        {databases.map((db) => (
                          <option key={db.id} value={db.id}>
                            {db.title} - {new Date(db.last_edited_time).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No databases found in your Notion workspace. Please create a database in Notion first.
                    </p>
                  )}
                </div>
              )}

              {/* Test Integration */}
              {status?.connected && status.databaseSelected && (
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Integration</h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Test the integration by saving a sample conversation to your selected Notion database.
                  </p>
                  
                  <button
                    onClick={handleSaveToNotion}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Test Save to Notion
                  </button>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">How it works</h3>
                <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                  <li>• Connect your Notion account to enable automatic saving of conversations</li>
                  <li>• Select a database where your conversations will be saved</li>
                  <li>• Each conversation will be created as a new page in your selected database</li>
                  <li>• Conversations include title, content, summary, and tags</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}