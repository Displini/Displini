import { useState } from 'react';
import { Lightbulb, TrendingUp, ThumbsUp, Send, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { SEO } from '@/app/components/shared/SEO';
import { colors } from '@/lib/designSystem';
import { handleSuccess, handleError } from '@/lib/errorHandling';
import { Header } from '@/app/pages/landing/components/Header';
import { LandingFooter } from '@/app/pages/landing/components/LandingFooter';
import { ChatButton } from '@/app/components/shared/ChatButton';
import { useFeatureRequests, useCreateFeatureRequest, useLikeFeatureRequest } from '@/hooks/useFeatureRequests';
import type { SortOption } from '@/api/featureRequests';

const statusLabels: Record<string, string> = {
  'planned': 'Planned',
  'in-progress': 'In Progress',
  'completed': 'Completed',
};

export default function FeatureRequests() {
  const [sort, setSort] = useState<SortOption>('top');
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    email: ''
  });

  // Fetch feature requests
  const { data: allRequests, isLoading, error } = useFeatureRequests(sort);
  
  // Filter requests based on completed filter
  const requests = showCompleted 
    ? allRequests?.filter(req => req.status === 'completed')
    : allRequests;
  
  // Mutations
  const createMutation = useCreateFeatureRequest();
  const likeMutation = useLikeFeatureRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category || undefined,
        email: formData.email || undefined,
      });
      
      handleSuccess('Feature request submitted! We\'ll review it and get back to you.', 'Thank You');
      setFormData({ title: '', description: '', category: '', email: '' });
    } catch (error) {
      handleError(error, { title: 'Failed to Submit Request' });
    }
  };

  const handleLike = (id: string) => {
    likeMutation.mutate(id);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SEO
          title="Feature Requests"
          description="Request new features and vote on upcoming additions to Displini."
          url="https://displini.com/feature-requests"
        />
      
      <div className="py-8 md:py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Feature Requests</h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400">
              Help us build the features you want. Share your ideas!
            </p>
          </div>

          {/* How It Works - Above Popular Requests, side-by-side on mobile */}
          <div className="mb-8 md:mb-12">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8">
              <div className="text-center">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold"
                  style={{ backgroundColor: colors.brand.primary }}
                >
                  1
                </div>
                <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white">Submit</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 px-1">Share your feature idea with us</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold"
                  style={{ backgroundColor: colors.brand.primary }}
                >
                  2
                </div>
                <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white">Review</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 px-1">We review and prioritize requests</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold"
                  style={{ backgroundColor: colors.brand.primary }}
                >
                  3
                </div>
                <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white">Build</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 px-1">Top requests get built into the app</p>
              </div>
            </div>
          </div>

          {/* Sort Toggle */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-6 md:mb-8">
            <Button
              variant={sort === 'top' ? 'default' : 'outline'}
              onClick={() => {
                setSort('top');
                setShowCompleted(false);
              }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Requests
            </Button>
            <Button
              variant={sort === 'new' ? 'default' : 'outline'}
              onClick={() => {
                setSort('new');
                setShowCompleted(false);
              }}
            >
              Newest First
            </Button>
            <Button
              variant={showCompleted ? 'default' : 'outline'}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {/* Feature Requests List */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" style={{ color: colors.brand.primary }} />
                {sort === 'top' ? 'Popular Requests' : 'Recent Requests'}
              </h2>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.brand.primary }} />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading requests...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to load feature requests. Please try again.</span>
                  </div>
                </Card>
              )}

              {/* Empty State */}
              {!isLoading && !error && (!requests || requests.length === 0) && (
                <Card className="p-8 text-center bg-white dark:bg-gray-800">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-gray-600 dark:text-gray-400">No feature requests yet. Be the first to submit one!</p>
                </Card>
              )}

              {/* Requests List */}
              {!isLoading && !error && requests && requests.length > 0 && (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{request.title}</h3>
                          {request.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{request.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <ThumbsUp className={`w-4 h-4 ${request.userLiked ? 'fill-current' : ''}`} />
                              {request.likeCount} {request.likeCount === 1 ? 'vote' : 'votes'}
                            </span>
                            {request.category && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                                {request.category}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              request.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {statusLabels[request.status] || request.status}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant={request.userLiked ? 'default' : 'ghost'} 
                          size="sm"
                          onClick={() => handleLike(request.id)}
                          disabled={likeMutation.isPending}
                          className="flex-shrink-0"
                        >
                          <ThumbsUp className={`w-4 h-4 ${request.userLiked ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Request Form */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-6 h-6" style={{ color: colors.brand.secondary }} />
                Submit Your Idea
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Feature Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Dark Mode Support"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Describe the feature and how it would help you..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., UI/UX, Mobile, Features"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Your Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    We'll notify you when we implement your feature!
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feature Request
                    </>
                  )}
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

