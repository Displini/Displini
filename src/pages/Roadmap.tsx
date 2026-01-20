import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/general/SEO';
import { colors } from '@/lib/designSystem';
import { Header } from '@/pages/landing/components/Header';
import { LandingFooter } from '@/pages/landing/components/LandingFooter';
import { ChatButton } from '@/components/general/ChatButton';

type FeatureStatus = 'completed' | 'in-progress' | 'planned';
type QuarterStatus = 'completed' | 'in-progress' | 'planned';

interface Feature {
  name: string;
  status: FeatureStatus;
}

interface RoadmapQuarter {
  quarter: string;
  status: QuarterStatus;
  features: Feature[];
}

export default function Roadmap() {
  const roadmap: RoadmapQuarter[] = [
    {
      quarter: 'Q4 2025',
      status: 'in-progress',
      features: [
        { name: 'Web App Launch', status: 'planned' },
        { name: 'Making Reminder', status: 'in-progress' },
        { name: 'Making To-Do', status: 'in-progress' },
        { name: 'Making Calendar', status: 'in-progress' },
        { name: 'Making AI', status: 'in-progress' },
        { name: 'Calendar Sync', status: 'planned' },
        { name: 'AI Integration with OpenAI', status: 'planned' },
        { name: 'Backend Integrations and Login', status: 'in-progress' },
        { name: 'Features Implementation', status: 'planned' }
      ]
    },
    {
      quarter: 'Q1 2026',
      status: 'planned',
      features: [
        { name: 'Apple Watch App', status: 'planned' },
        { name: 'Widgets', status: 'planned' },
        { name: 'Collaboration Features', status: 'planned' }
      ]
    },
    {
      quarter: 'Q2 2026',
      status: 'planned',
      features: [
        { name: 'API for Developers', status: 'planned' },
        { name: 'Zapier Integration', status: 'planned' },
        { name: 'Advanced Analytics', status: 'planned' }
      ]
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="Roadmap"
          description="See what's coming next to Displini. Features in development and planned updates."
          url="https://displini.com/roadmap"
        />
      
        <div className="py-8 md:py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Product Roadmap</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 md:mb-12">
            See what we're building and what's coming next
          </p>

          <div className="space-y-6 md:space-y-8">
            {roadmap.map((quarter, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 md:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{quarter.quarter}</h2>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    quarter.status === 'completed' ? 'bg-green-100 text-green-700' :
                    quarter.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {quarter.status === 'in-progress' ? 'In Progress' : 
                     quarter.status === 'completed' ? 'Completed' : 'Planned'}
                  </span>
                </div>

                <ul className="space-y-3 md:space-y-4">
                  {quarter.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3">
                      {feature.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                      ) : feature.status === 'in-progress' ? (
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm sm:text-base ${feature.status === 'completed' ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 md:mt-16 text-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 sm:p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
              Have a Feature Request?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8">
              We'd love to hear your ideas! Tell us what features you'd like to see.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Submit Feature Request
            </Button>
          </div>
        </div>
        </div>
      </div>
      <LandingFooter />
      <ChatButton />
    </>
  );
}

