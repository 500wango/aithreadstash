"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ApiService, type Conversation } from "@/lib/api";
import Logo from "@/components/Logo";

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Auth guard
    if (!ApiService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }

    const idParam = params?.id;
    const idNum = typeof idParam === "string" ? parseInt(idParam, 10) : Array.isArray(idParam) ? parseInt(idParam[0]!, 10) : NaN;
    if (Number.isNaN(idNum)) {
      setError("Invalid conversation id");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        const data = await ApiService.getConversation(idNum);
        setConversation(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              <Logo />
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
              <Link href="/conversations" className="text-blue-600 dark:text-blue-400 font-semibold">Conversations</Link>
              <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Settings</Link>
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <div className="mt-4">
                <Link href="/conversations" className="text-blue-600 dark:text-blue-400 hover:underline">Back to list</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Logo height={36} />
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
            <Link href="/conversations" className="text-blue-600 dark:text-blue-400 font-semibold">Conversations</Link>
            <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Settings</Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{conversation.title}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {conversation.messages.length} messages • {new Date(conversation.createdAt).toLocaleString()} •
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ml-2 ${
                  conversation.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {conversation.status}
                </span>
              </p>
              {conversation.tags && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {conversation.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/conversations')}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Back to list
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-slate-700 pt-6 space-y-6">
            {conversation.messages.map((m, idx) => (
              <div key={idx} className="">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {m.role === 'user' ? 'You' : m.role === 'assistant' ? 'AI' : m.role}
                </div>
                <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                  {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}