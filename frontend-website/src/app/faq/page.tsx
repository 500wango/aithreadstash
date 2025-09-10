import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function FAQPage() {
  const faqs = [
    {
      q: "What is AI ThreadStash?",
      a: "AI ThreadStash helps you capture, organize, and search your AI conversations across tools to build your personal knowledge base.",
    },
    {
      q: "Is my data private?",
      a: "By default, you can use a strict local-only mode where conversations are stored only in your browser. You can also opt-in to sync with the backend for multi-device access.",
    },
    {
      q: "How much does it cost?",
      a: "We offer a free tier to get started and paid plans with advanced features. See the Pricing page for details.",
    },
    {
      q: "Which providers are supported?",
      a: "We support popular AI providers and platforms via our browser extension and direct integrations, and we continue to expand support.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <section className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12">Answers to common questions about using AI ThreadStash.</p>

          <div className="space-y-6">
            {faqs.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-gray-700 dark:text-gray-300">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">View Pricing</Link>
          </div>
        </section>
      </main>
    </div>
  );
}