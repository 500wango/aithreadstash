"use client";

import { useEffect, useState } from "react";
import { ApiService, type Conversation } from "@/lib/api";

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setCount(null);
    try {
      // 拉取所有会话（本地存储）
      const conversations: Conversation[] = await ApiService.getAllConversations(200);
      setCount(conversations.length);

      // 生成导出 JSON（简化版）
      const payload = {
        exportedAt: new Date().toISOString(),
        total: conversations.length,
        conversations,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `threadstash-export-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Export failed, please try again";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 不自动触发导出，避免页面一打开就下载；给用户手动操作
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <header className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Export Your Data</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          Click the button below to export all conversation data saved in your browser as a JSON file.
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-5 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700 transition"
            >
              {loading ? "Exporting..." : "Export Data"}
            </button>
            {count !== null && (
              <span className="text-sm text-slate-500 dark:text-slate-400">Packed {count} conversations</span>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Note: The export only uses conversation data stored in your browser (localStorage). No requests will be sent to the server.
          </div>
        </div>
      </header>
    </div>
  );
}