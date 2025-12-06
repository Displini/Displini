import { SEO } from '@/app/components/shared/SEO';
import { colors } from '@/lib/designSystem';
import { Header } from '@/app/pages/landing/components/Header';
import { LandingFooter } from '@/app/pages/landing/components/LandingFooter';
import { LandingAbout } from '@/app/pages/landing/components/LandingAbout';
import { LandingMadeBy } from '@/app/pages/landing/components/LandingMadeBy';
import { ChatButton } from '@/app/components/shared/ChatButton';

export default function About() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="About Us"
          description="Learn about Displini's mission, values, and story. Discover how we're building a space where focus, balance, and wellbeing work together."
          url="https://displini.com/about"
        />
        <div className="pt-24">
          <LandingAbout />
          <LandingMadeBy />
        </div>
      </div>
      <LandingFooter />
      <ChatButton />
    </>
  );
}

