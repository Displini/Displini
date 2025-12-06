import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as featureRequestsAPI from '@/api/featureRequests';
import type { FeatureRequest, CreateFeatureRequestInput, SortOption } from '@/api/featureRequests';

/**
 * React Query hooks for Feature Requests
 * 
 * Provides:
 * - useFeatureRequests: Fetch and cache feature requests list
 * - useCreateFeatureRequest: Create a new feature request
 * - useLikeFeatureRequest: Like/unlike a feature request with optimistic updates
 */

/**
 * Fetch feature requests with sorting
 */
export function useFeatureRequests(sort: SortOption = 'top') {
  return useQuery({
    queryKey: ['featureRequests', sort],
    queryFn: () => featureRequestsAPI.listFeatureRequests(sort),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Create a new feature request
 */
export function useCreateFeatureRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateFeatureRequestInput) => 
      featureRequestsAPI.createFeatureRequest(input),
    onSuccess: () => {
      // Invalidate all feature request queries to refetch
      queryClient.invalidateQueries({ queryKey: ['featureRequests'] });
    },
  });
}

/**
 * Like/unlike a feature request with optimistic updates
 */
export function useLikeFeatureRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => featureRequestsAPI.likeFeatureRequest(id),
    
    // Optimistic update: update UI immediately before server responds
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['featureRequests'] });
      
      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: ['featureRequests'] });
      
      // Optimistically update all cached queries
      queryClient.setQueriesData<FeatureRequest[]>(
        { queryKey: ['featureRequests'] },
        (old) => {
          if (!old) return old;
          
          return old.map((req) => {
            if (req.id === id) {
              const wasLiked = req.userLiked ?? false;
              return {
                ...req,
                likeCount: wasLiked ? req.likeCount - 1 : req.likeCount + 1,
                userLiked: !wasLiked,
              };
            }
            return req;
          });
        }
      );
      
      // Return context with previous data for rollback
      return { previousQueries };
    },
    
    // If mutation fails, rollback to previous state
    onError: (err, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    // Always refetch after mutation settles (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['featureRequests'] });
    },
  });
}

