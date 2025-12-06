import { SEO } from '@/app/components/shared/SEO';
import { Header } from '@/app/pages/landing/components/Header';
import { LandingFooter } from '@/app/pages/landing/components/LandingFooter';
import { colors } from '@/lib/designSystem';
import { ChatButton } from '@/app/components/shared/ChatButton';

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="Privacy Policy"
          description="Displini Privacy Policy - How we collect, use, and protect your data."
          url="https://displini.com/privacy"
        />
      
        <div className="py-8 md:py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8"><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none dark:prose-invert prose-sm sm:prose-base">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-3 md:mb-4">
                This Privacy Policy describes how <strong>Displini</strong> ("we", "us", "our") collects, uses, and protects your personal data when you use the Displini web, iOS, or Android app ("the Service"). By using Displini, you agree to this Privacy Policy.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">1. Information We Collect</h2>
              
              <h3 className="text-lg sm:text-xl font-semibold mb-2 md:mb-3 text-gray-900 dark:text-white">1.1 Account Information</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Name</li>
                <li>Email</li>
                <li>Password or OAuth login (Google/Apple)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-semibold mb-2 md:mb-3 text-gray-900 dark:text-white">1.2 App Data</h3>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2 mb-3 md:mb-4">
                <li>Tasks, reminders, schedules, notes</li>
                <li>Work and school schedules</li>
                <li>Health-related data: sleep, menstruation tracking, medication reminders, water intake</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-semibold mb-2 md:mb-3 text-gray-900 dark:text-white">1.3 Device Information</h3>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2 mb-3 md:mb-4">
                <li>IP address</li>
                <li>Browser and device type</li>
                <li>Operating system</li>
                <li>Crash logs</li>
                <li>Usage data</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-semibold mb-2 md:mb-3 text-gray-900 dark:text-white">1.4 Analytics</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-3 md:mb-4">
                We may use analytics tools such as Google Analytics or Mixpanel.
              </p>

              <h3 className="text-lg sm:text-xl font-semibold mb-2 md:mb-3 text-gray-900 dark:text-white">1.5 Payments</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Payment information is handled securely by <strong>Stripe</strong>. We do not store full payment details.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2 mb-3 md:mb-4">
                <li>Provide the core Displini features</li>
                <li>Sync data across devices</li>
                <li>Process payments</li>
                <li>Provide AI suggestions</li>
                <li>Improve the app</li>
                <li>Authenticate your account</li>
                <li>Customer support</li>
              </ul>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
                We never sell your data.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">3. AI Usage</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Displini uses OpenAI (ChatGPT) to generate insights and suggestions. Data sent for AI processing is not stored by OpenAI.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">4. Third-Party Services</h2>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2">
                <li>Mailchimp — emails and newsletters</li>
                <li>Stripe — payments</li>
                <li>Google OAuth / Apple Sign-In — authentication</li>
                <li>Analytics providers</li>
                <li>Database provider (TBA)</li>
                <li>OpenAI — AI features</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">5. Cookies</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We may use cookies for sessions, preferences, and analytics.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">6. Data Retention</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We store your data <strong>until you delete your account</strong>. All personal, schedule, and health-related data is removed permanently after deletion.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">7. Your Rights (GDPR)</h2>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2">
                <li>Access your data</li>
                <li>Correct your data</li>
                <li>Delete your account</li>
                <li>Export your data</li>
                <li>Withdraw consent</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">8. Security</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We apply industry-standard security practices to protect your data.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">9. Age Requirement</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Users must be at least <strong>13 years old</strong>.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">10. Future Features</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We may add additional features, including AI improvements and calendar syncing.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">11. Contact</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Email: <strong>support@displini.com</strong><br />
                Location: Eindhoven, Noord-Brabant, The Netherlands
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
      <LandingFooter />
      <ChatButton />
    </>
  );
}

