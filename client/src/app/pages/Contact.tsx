import { useState } from 'react';
import { Send, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { SEO } from '@/app/components/shared/SEO';
import { colors } from '@/lib/designSystem';
import { handleSuccess, handleError } from '@/lib/errorHandling';
import { Header } from '@/app/pages/landing/components/Header';
import { LandingFooter } from '@/app/pages/landing/components/LandingFooter';
import { ChatButton } from '@/app/components/shared/ChatButton';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Send to backend API
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      handleSuccess('Message sent! We\'ll get back to you soon.', 'Thank You');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      handleError(error, { 
        title: 'Failed to Send Message',
        description: 'Please try again or email us directly at hello@displini.com'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="Contact Us"
          description="Get in touch with the Displini team. We'd love to hear from you!"
          url="https://displini.com/contact"
        />
      
      <div className="py-8 md:py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Get in Touch</h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Contact Information</h2>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.brand.primary}20` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: colors.brand.primary }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <a href="mailto:hello@displini.com" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                      hello@displini.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.brand.secondary}20` }}
                  >
                    <MessageSquare className="w-6 h-6" style={{ color: colors.brand.secondary }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Live Chat</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Available 24/7
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">Quick Response Time</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  We typically respond within 24 hours on business days.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-900 dark:text-white">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Your name"
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="your.email@example.com"
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-gray-900 dark:text-white">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    placeholder="How can we help?"
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-900 dark:text-white">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    placeholder="Tell us more..."
                    rows={6}
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
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

