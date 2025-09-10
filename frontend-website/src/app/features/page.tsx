import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Brain, Shield, Zap, Globe, Users } from 'lucide-react';
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: 'Features - AI ThreadStash',
  description: 'Discover the powerful features of AI ThreadStash - intelligent conversation management, seamless integrations, and advanced AI capabilities.',
};

const features = [
  {
    icon: MessageSquare,
    title: 'Smart Conversation Management',
    description: 'Organize and manage your AI conversations with intelligent categorization, tagging, and search capabilities.',
    benefits: ['Auto-categorization', 'Advanced search', 'Tag management', 'Conversation history']
  },
  {
    icon: Brain,
    title: 'Multi-AI Platform Support',
    description: 'Connect with multiple AI platforms including ChatGPT, Claude, and other leading AI services in one unified interface.',
    benefits: ['Multiple AI providers', 'Unified interface', 'Cross-platform sync', 'Model comparison']
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Your conversations are encrypted and stored securely with enterprise-grade security measures.',
    benefits: ['End-to-end encryption', 'Secure storage', 'Privacy controls', 'Data ownership']
  },
  {
    icon: Zap,
    title: 'Browser Extension',
    description: 'Seamlessly capture and save AI conversations directly from your browser with our powerful extension.',
    benefits: ['One-click save', 'Auto-sync', 'Cross-browser support', 'Instant access']
  },
  {
    icon: Globe,
    title: 'Notion Integration',
    description: 'Sync your conversations directly to Notion for enhanced productivity and knowledge management.',
    benefits: ['Real-time sync', 'Custom templates', 'Database integration', 'Workflow automation']
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share insights and collaborate with your team through organized conversation collections.',
    benefits: ['Team workspaces', 'Shared collections', 'Permission controls', 'Collaborative notes']
  }
];

const additionalFeatures = [
  'Advanced search and filtering',
  'Export conversations in multiple formats',
  'Custom tags and categories',
  'Conversation analytics and insights',
  'API access for developers',
  'Mobile-responsive design',
  'Dark mode support',
  'Keyboard shortcuts',
  'Bulk operations',
  'Regular backups'
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      {/* Hero Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="text-indigo-600"> AI Conversation Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover how AI ThreadStash transforms the way you manage, organize, and leverage your AI conversations with cutting-edge features designed for productivity.
          </p>
        </div>
      </div>

      {/* Main Features */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <IconComponent className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 ml-4">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                        <ArrowRight className="h-4 w-4 text-indigo-500 mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">And Much More</h2>
            <p className="text-lg text-gray-600">Additional features that make AI ThreadStash the complete solution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your AI Workflow?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of users who are already managing their AI conversations more effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-indigo-600 px-8 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="border border-white text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AI ThreadStash</h3>
              <p className="text-gray-400">Intelligent conversation management for the AI era.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 AI ThreadStash. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}