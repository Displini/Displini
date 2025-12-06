import { SEO } from '@/app/components/shared/SEO';
import { Header } from '@/app/pages/landing/components/Header';
import { LandingFooter } from '@/app/pages/landing/components/LandingFooter';
import { colors } from '@/lib/designSystem';
import { ChatButton } from '@/app/components/shared/ChatButton';

export default function TermsOfService() {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="Terms of Service"
          description="Displini Terms of Service - Legal terms and conditions for using our app."
          url="https://displini.com/terms"
        />
      
        <div className="py-8 md:py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">Terms of Use</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8"><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none dark:prose-invert prose-sm sm:prose-base">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                These Terms of Use govern your use of <strong>Displini</strong> ("the App"). By creating an account or using the App, you agree to these Terms.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">1. About Displini</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-3 md:mb-4">
                Displini is a planning and wellness app offering:
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2">
                <li>Task and schedule management</li>
                <li>Health and wellness tracking</li>
                <li>AI-powered suggestions</li>
                <li>Journaling features</li>
                <li>Work and school scheduling</li>
                <li>Calendar tools</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">2. User Responsibilities</h2>
              <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2">
                <li>Provide accurate information</li>
                <li>Do not misuse or disrupt the app</li>
                <li>Do not engage in illegal activity</li>
                <li>Be at least 13 years old</li>
                <li>Keep login credentials private</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">3. Account Termination</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We may suspend or terminate accounts that violate these terms or abuse the platform. You may delete your account at any time.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">4. Intellectual Property</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                All branding, design, UI, logos, content, and features in Displini are owned by Displini. You may not copy, sell, or redistribute the app.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">5. Payments</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Payments for subscriptions or lifetime access are processed via <strong>Stripe</strong>. We do not store payment card details. Prices may change with notice.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">6. AI Features</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                AI suggestions may be inaccurate or incomplete. They are for informational purposes only and should not replace professional advice.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">7. Health Data Disclaimer</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Health features (sleep, menstruation, medication, water intake) do not constitute medical advice.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">8. Limitation of Liability</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We are not liable for data loss, service interruptions, or AI errors. The app is provided "as is".
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">9. Governing Law</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                These Terms are governed by the laws of <strong>The Netherlands</strong>.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">10. Changes</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We may update these Terms from time to time. Continued use of the app means acceptance of changes.
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

