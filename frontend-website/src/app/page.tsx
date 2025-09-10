import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Brain, Globe, ArrowRight, CheckCircle2, Camera, FolderOpen, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section: Left text + Right illustration */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Capture, Organize, and Leverage
              <span className="text-blue-600 dark:text-blue-400 block">Your AI Conversations</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
              AI ThreadStash helps you save and organize valuable AI conversations, seamlessly integrating them into your personal knowledge management workflow.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/register" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/pricing" className="px-6 py-3 rounded-md border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                View Pricing
              </Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ml-auto md:ml-0">
                Already have an account? Login
              </Link>
            </div>

            {/* Trust bullets */}
            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> One-click capture from major AI chats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Notion and Drive integrations</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Powerful search and tags</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Privacy-first, your data stays yours</li>
            </ul>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="relative rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur shadow-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-200/40 to-indigo-200/40 dark:from-blue-900/30 dark:to-indigo-900/30 blur-2xl -z-10"></div>
              <div className="aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
                <Image src="/hero-image.png" alt="Product preview" width={800} height={600} className="w-full h-full object-fill" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2.5 shadow-md flex items-center justify-center font-medium transform hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Capture
                </div>
                <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-2.5 shadow-md flex items-center justify-center font-medium transform hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  Organize
                </div>
                <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2.5 shadow-md flex items-center justify-center font-medium transform hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Search
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-7xl mx-auto mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center">Why AI ThreadStash</h2>
          <p className="mt-3 text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Focus on insights, not copy-paste. These essentials help you get value from every conversation.</p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-lg ring-1 ring-gray-100 dark:ring-slate-700">
              <Zap className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">One‑click Capture</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Save chats instantly from ChatGPT, Claude, Gemini and more.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-lg ring-1 ring-gray-100 dark:ring-slate-700">
              <Brain className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Organized Knowledge</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Tags, collections and search keep everything at your fingertips.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-lg ring-1 ring-gray-100 dark:ring-slate-700">
              <Shield className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Privacy‑first</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your data stays in your control with secure sync options.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-lg ring-1 ring-gray-100 dark:ring-slate-700">
              <Globe className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Works Everywhere</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Browser extension and web app—use it where you work.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center">How it works</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-md ring-1 ring-gray-100 dark:ring-slate-700">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">1</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Capture</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Use the extension to save AI chats in one click with context.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-md ring-1 ring-gray-100 dark:ring-slate-700">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">2</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Organize</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Add tags, group into collections and sync to Notion or Drive.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-md ring-1 ring-gray-100 dark:ring-slate-700">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">3</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Leverage</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Search and reuse insights across projects and your team.</p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-7xl mx-auto mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 md:p-12">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">Ready to stash your AI conversations?</h3>
            <p className="mt-2 text-blue-100">Start free today. No credit card required.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/register" className="bg-white text-blue-700 font-medium px-5 py-3 rounded-md hover:bg-blue-50">
                Get Started
              </Link>
              <Link href="/pricing" className="text-white border border-white/70 px-5 py-3 rounded-md hover:bg-white/10">
                See Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export const metadata: Metadata = {
  title: "AI ThreadStash | Capture, Organize, and Leverage Your AI Conversations",
  description:
    "Save and organize AI conversations from ChatGPT, Claude, Gemini and more. Powerful search, tags, and integrations with Notion & Google Drive. Privacy‑first.",
  keywords: [
    "AI conversations",
    "save AI chats",
    "ChatGPT history",
    "Claude conversations",
    "Gemini",
    "Notion integration",
    "Google Drive",
    "knowledge management",
    "AI notes",
    "conversation search",
  ],
  alternates: {
    canonical: "https://aithreadstash.com/",
  },
  openGraph: {
    title: "AI ThreadStash | Capture, Organize, and Leverage Your AI Conversations",
    description:
      "Save and organize AI conversations from ChatGPT, Claude, Gemini and more. Powerful search, tags, and integrations with Notion & Google Drive. Privacy‑first.",
    url: "https://aithreadstash.com/",
    siteName: "AI ThreadStash",
    images: [
      {
        url: "/hero-image.png",
        width: 1200,
        height: 630,
        alt: "AI ThreadStash preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI ThreadStash | Capture, Organize, and Leverage Your AI Conversations",
    description:
      "Save and organize AI conversations from ChatGPT, Claude, Gemini and more. Powerful search, tags, and integrations with Notion & Google Drive. Privacy‑first.",
    images: ["/hero-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
