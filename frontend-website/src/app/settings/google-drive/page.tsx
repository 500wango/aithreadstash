"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ApiService, type DriveStatus, type DriveFolder, API_BASE_URL } from "@/lib/api";
import Logo from "@/components/Logo";

export default function GoogleDriveSettings() {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const extractMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const anyErr = err as { message?: unknown };
      if (typeof anyErr.message === "string") return anyErr.message;
    }
    return fallback;
  };

  const loadFolders = useCallback(async () => {
    try {
      const response = await ApiService.getDriveFolders();
      setFolders(response.folders);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to load Drive folders"));
    }
  }, []);

  const loadDriveStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getDriveStatus();
      setStatus(response.status);
      if (response.status.connected) {
        await loadFolders();
      }
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to load Drive status"));
    } finally {
      setIsLoading(false);
    }
  }, [loadFolders]);

  useEffect(() => {
    if (!ApiService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    loadDriveStatus();
  }, [loadDriveStatus]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await ApiService.getDriveOAuthUrl();

      const popup = window.open(
        response.url,
        "gdrive-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        setError("Popup was blocked, please allow popups and try again");
        return;
      }

      const apiOrigin = new URL(API_BASE_URL).origin;

      const messageListener = (event: MessageEvent) => {
        // 允许来自当前前端页面同源，或后端 API 源（用于后端回调页面 postMessage）
        if (event.origin !== window.location.origin && event.origin !== apiOrigin) return;

        if (event.data.type === "GDRIVE_AUTH_SUCCESS") {
          popup.close();
          window.removeEventListener("message", messageListener);
          const folderName = event.data.folderName as string | undefined;
          setSuccess(
            `Google Drive connected successfully${folderName ? `, default folder: ${folderName}` : ""}`
          );
          loadDriveStatus();
          loadFolders();
        } else if (event.data.type === "GDRIVE_AUTH_CANCELLED") {
          popup.close();
          window.removeEventListener("message", messageListener);
        }
      };

      window.addEventListener("message", messageListener);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
        }
      }, 1000);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to start Google Drive connection"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Google Drive? This will remove your access token and selected folder."
      )
    ) {
      return;
    }

    try {
      await ApiService.disconnectDrive();
      setStatus({ connected: false, folderSelected: false });
      setFolders([]);
      setSelectedFolder("");
      setSuccess("Successfully disconnected from Google Drive");
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to disconnect from Google Drive"));
    }
  };

  const handleFolderSelect = async (folderId: string) => {
    try {
      const folder = folders.find((f) => f.id === folderId);
      await ApiService.selectDriveFolder(folderId, folder?.name);
      setSelectedFolder(folderId);
      setSuccess("Folder selected successfully");
      setTimeout(loadDriveStatus, 800);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to select folder"));
    }
  };

  const handleTestSave = async () => {
    try {
      setError("");
      setSuccess("");
      const testData = {
        title: "Test Conversation - " + new Date().toLocaleString(),
        content:
          "This is a test conversation saved from AI ThreadStash settings page. If you can see this, your Google Drive integration is working correctly!",
        summary: "Test conversation to verify Google Drive integration",
        tags: "test,integration,aithreadstash",
      };
      const result = await ApiService.saveToDrive(testData);
      setSuccess(`Successfully saved to Google Drive! File URL: ${result.url}`);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to save to Google Drive"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Google Drive settings...</p>
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
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.87 3.5l5.63 9.75-3.25 5.63H7.38L4.13 13.25 7.38 7.5h5.49l-2.75-4zM8.5 9l-2.25 4 2.25 4h7l2.25-4-2.25-4h-7z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Google Drive Integration</h1>
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
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${status?.connected ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {status?.connected ? "Connected to Google Drive" : "Not connected"}
                    </span>
                    {status?.folderName && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        (Folder: {status.folderName})
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
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? "Connecting..." : "Connect to Google Drive"}
                    </button>
                  )}
                </div>
              </div>

              {/* Folder Selection */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Default Export Folder</h2>
                {status?.connected ? (
                  <div className="space-y-4">
                    <select
                      className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                    >
                      <option value="">Select a folder</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => selectedFolder && handleFolderSelect(selectedFolder)}
                      disabled={!selectedFolder}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save as Default Folder
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">Connect your Google Drive account to select a default export folder.</p>
                )}
              </div>

              {/* Test Save */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Save</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Save a test conversation to your selected Google Drive folder to verify the integration.
                </p>
                <button
                  onClick={handleTestSave}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  Save Test Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}