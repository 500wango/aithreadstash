import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from "@/components/Navbar";

const helpSections = [
  {
    title: "Getting Started",
    items: [
      { question: "How do I create an account?", answer: "Click on 'Sign Up' from the homepage and follow the registration process." },
      { question: "How do I install the browser extension?", answer: "Download our browser extension from the Chrome Web Store or Firefox Add-ons store." },
      { question: "How do I connect my first AI platform?", answer: "Go to Settings > Integrations and follow the setup instructions for your preferred AI platform." }
    ]
  },
  {
    title: "Using the Dashboard",
    items: [
      { question: "How do I save conversations?", answer: "Use our browser extension to automatically capture conversations or manually import them from the dashboard." },
      { question: "How do I organize my conversations?", answer: "Use tags, categories, and folders to organize your conversations for easy retrieval." },
      { question: "How do I search through my conversations?", answer: "Use the search bar in the dashboard to find specific conversations by content, tags, or dates." }
    ]
  },
  {
    title: "Integrations",
    items: [
      { question: "Which AI platforms are supported?", answer: "We support ChatGPT, Claude, Gemini, and other major AI platforms with more being added regularly." },
      { question: "How do I connect Notion?", answer: "Go to Settings > Notion Integration and follow the OAuth authentication process." },
      { question: "Is Google Drive integration available?", answer: "Yes, you can export your conversations to Google Drive from the Export page." }
    ]
  },
  {
    title: "Billing & Subscription",
    items: [
      { question: "What's included in the free plan?", answer: "The free plan includes basic conversation management with limited storage and export capabilities." },
      { question: "How do I upgrade to Pro?", answer: "Go to the Pricing page and select the Pro plan to start your subscription." },
      { question: "How do I cancel my subscription?", answer: "You can cancel your subscription at any time from the Billing page in your dashboard." }
    ]
  },
  {
    title: "Troubleshooting",
    items: [
      { question: "The browser extension isn't working", answer: "Try refreshing the page, restarting your browser, or reinstalling the extension." },
      { question: "I can't log in to my account", answer: "Use the 'Forgot Password' link or contact our support team for assistance." },
      { question: "My conversations aren't syncing", answer: "Check your internet connection and make sure you're logged into the same account on all devices." }
    ]
  }
];

export const metadata: Metadata = {
  title: 'Help Center - AI ThreadStash',
  description: 'Get help with AI ThreadStash - find answers to common questions, troubleshooting guides, and support resources.',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Help Center
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Find answers to common questions and get help with AI ThreadStash
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="border border-gray-300 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                View FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-12">
            {helpSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {section.title}
                </h2>
                
                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-b border-gray-200 dark:border-slate-700 pb-6 last:border-b-0 last:pb-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our support team is here to help you get the most out of AI ThreadStash
            </p>
            <Link
              href="/contact"
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}