"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiService, Conversation } from "@/lib/api";
import Link from 'next/link';
import Logo from "@/components/Logo";

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getConversations(filter === "all" ? undefined : filter);
      setConversations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
     } finally {
       setIsLoading(false);
     }
  }, [filter]);

  useEffect(() => {
    if (!ApiService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    loadConversations();
  }, [filter, loadConversations]);

  const handleArchive = async (id: number) => {
    try {
      await ApiService.archiveConversation(id);
      loadConversations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to archive conversation");
     }
   };

  const handleRestore = async (id: number) => {
    try {
      await ApiService.restoreConversation(id);
      loadConversations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to restore conversation");
     }
   };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      return;
    }
    
    try {
      await ApiService.deleteConversation(id);
      loadConversations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
     }
   };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading conversations...</p>
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
            <Link href="/conversations" className="text-blue-600 dark:text-blue-400 font-semibold">
              Conversations
            </Link>
            <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Settings
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
           <div className="flex items-start gap-2 text-sm">
             <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
             </svg>
             <p className="text-blue-800 dark:text-blue-200">
               Your conversations are only stored in this browser's local storage and are not uploaded to the server. Clearing or exporting only affects local data.
               <Link href="/settings" className="ml-2 underline hover:text-blue-700 dark:hover:text-blue-300">Go to Settings &gt; Privacy &amp; Data</Link>
             </p>
           </div>
         </div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Conversations</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-4 py-2 rounded-md ${
                  filter === "active"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("archived")}
                className={`px-4 py-2 rounded-md ${
                  filter === "archived"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600"
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No conversations found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {filter === "archived" 
                  ? "You don't have any archived conversations yet."
                  : "Start by saving your first AI conversation!"
                }
              </p>
              {filter !== "archived" && (
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {conversation.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {conversation.messages.length} messages • 
                        {new Date(conversation.createdAt).toLocaleDateString()} • 
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ml-2 ${
                          conversation.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {conversation.status}
                        </span>
                      </p>
                      {conversation.summary && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {conversation.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {conversation.status === 'active' ? (
                        <button
                          onClick={() => handleArchive(conversation.id)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                          title="Archive conversation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(conversation.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          title="Restore conversation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      {/* View full conversation */}
                      <Link
                        href={`/conversations/${conversation.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="View full conversation"
                      >
                        <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">Read full text</button>
                      </Link>
                      {/* Delete conversation */}
                      <button
                        onClick={() => handleDelete(conversation.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Delete conversation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                      {conversation.messages.slice(0, 3).map((message, index) => (
                        <div key={index} className="flex items-start">
                          <span className="font-medium text-gray-900 dark:text-white mr-2">
                            {message.role === 'user' ? 'You:' : 'AI:'}
                          </span>
                          <span className="truncate">
                            {typeof message.content === 'string' 
                              ? message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
                              : 'Message content'
                            }
                          </span>
                        </div>
                      ))}
                      {conversation.messages.length > 3 && (
                        <p className="text-gray-500 dark:text-gray-400">
                          {conversation.messages.length - 3} more messages
                        </p>
                      )}
                    </div>
                  </div>

                  {conversation.tags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {conversation.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}