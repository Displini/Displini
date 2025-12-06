import { Users, Share2, Building2, Star, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { SEO } from '@/app/components/shared/SEO';
import { colors } from '@/lib/designSystem';
import { Header } from '@/app/pages/landing/components/Header';
import { LandingFooter } from '@/app/pages/landing/components/LandingFooter';
import { ChatButton } from '@/app/components/shared/ChatButton';

export default function Collaboration() {
  const collaborationTypes = [
    {
      icon: Users,
      title: 'Community Partnerships',
      description: 'Join our growing community of wellness enthusiasts. Share your journey, inspire others, and grow together.'
    },
    {
      icon: Star,
      title: 'Influencer Program',
      description: 'Are you a content creator in health, productivity, or lifestyle? Partner with us to reach your audience authentically.'
    },
    {
      icon: Building2,
      title: 'Brand Collaborations',
      description: 'We partner with brands that align with our values of health and productivity. Let\'s create something amazing together.'
    },
    {
      icon: Heart,
      title: 'Wellness Experts',
      description: 'Nutritionists, fitness trainers, therapists - collaborate with us to bring expert insights to our users.'
    }
  ];

  const benefits = [
    'Access to engaged, health-conscious audience',
    'Co-marketing opportunities',
    'Featured in app and social media',
    'Early access to new features',
    'Revenue sharing opportunities',
    'Dedicated support team'
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="Collaborations"
          description="Partner with Displini. Join our community, influencer program, or explore brand partnerships."
          keywords="partnerships, influencers, brand collaboration, community"
          url="https://displini.com/collaboration"
        />
      
        <div className="py-8 md:py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Collaborate with Displini</h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Join our community, become a partner, or collaborate with our brand. 
              Let's build something amazing together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 lg:mb-16">
            {collaborationTypes.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 md:mb-4"
                    style={{ backgroundColor: `${colors.brand.secondary}20` }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: colors.brand.secondary }} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white text-center">Partnership Benefits</h2>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 md:gap-3">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colors.brand.primary }} />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 sm:p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
              Interested in Collaborating?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Whether you're an influencer, brand, or community leader, we'd love to hear from you. 
              Let's explore how we can work together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Apply for Partnership
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
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

