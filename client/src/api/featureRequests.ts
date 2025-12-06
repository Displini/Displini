/**
 * Feature Requests API Layer
 * 
 * Currently uses in-memory mock data with artificial delays.
 * When backend is ready, replace mock implementations with real API calls.
 */

// Types
export type FeatureRequestStatus = 'planned' | 'in-progress' | 'completed';
export type SortOption = 'top' | 'new';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category?: string;
  status: FeatureRequestStatus;
  likeCount: number;
  createdAt: string;
  userLiked?: boolean; // Track if current user liked it
}

export interface CreateFeatureRequestInput {
  title: string;
  description: string;
  category?: string;
  email?: string; // Optional email from form
}

// Helper to simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory mock data
let mockData: FeatureRequest[] = [
  {
    id: '1',
    title: 'Dark Mode',
    description: 'Add a dark mode theme option for better night-time usage and reduced eye strain. This would include system preference detection and manual toggle.',
    category: 'UI/UX',
    status: 'in-progress',
    likeCount: 127,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    userLiked: false,
  },
  {
    id: '2',
    title: 'Apple Watch App',
    description: 'Create a native Apple Watch app for quick task viewing, reminders, and health tracking on the go.',
    category: 'Mobile',
    status: 'planned',
    likeCount: 95,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    userLiked: false,
  },
  {
    id: '3',
    title: 'Shared Calendars',
    description: 'Enable calendar sharing with family members, team members, or friends for better coordination.',
    category: 'Collaboration',
    status: 'planned',
    likeCount: 73,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    userLiked: false,
  },
  {
    id: '4',
    title: 'Custom Themes',
    description: 'Allow users to customize app colors, fonts, and layouts to match their personal preferences.',
    category: 'UI/UX',
    status: 'completed',
    likeCount: 61,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    userLiked: false,
  },
  {
    id: '5',
    title: 'Recurring Tasks',
    description: 'Add support for recurring tasks with flexible schedules (daily, weekly, monthly, custom patterns).',
    category: 'Features',
    status: 'planned',
    likeCount: 89,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userLiked: false,
  },
  {
    id: '6',
    title: 'Export Data',
    description: 'Allow users to export their data in various formats (CSV, JSON, PDF) for backup or analysis.',
    category: 'Features',
    status: 'planned',
    likeCount: 45,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    userLiked: false,
  },
];

// Track liked requests (simulating user session)
const likedRequestIds = new Set<string>();

/**
 * List all feature requests with optional sorting
 */
export async function listFeatureRequests(sort: SortOption = 'top'): Promise<FeatureRequest[]> {
  await delay(300);
  
  let sorted = [...mockData];
  
  if (sort === 'top') {
    // Sort by like count (descending)
    sorted.sort((a, b) => b.likeCount - a.likeCount);
  } else if (sort === 'new') {
    // Sort by creation date (newest first)
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Mark which requests the user has liked
  return sorted.map(req => ({
    ...req,
    userLiked: likedRequestIds.has(req.id),
  }));
}

/**
 * Create a new feature request
 */
export async function createFeatureRequest(input: CreateFeatureRequestInput): Promise<FeatureRequest> {
  await delay(600);
  
  const newRequest: FeatureRequest = {
    id: Date.now().toString(), // Simple ID generation for mock
    title: input.title,
    description: input.description,
    category: input.category,
    status: 'planned',
    likeCount: 0,
    createdAt: new Date().toISOString(),
    userLiked: false,
  };
  
  mockData.unshift(newRequest); // Add to beginning
  return newRequest;
}

/**
 * Like/unlike a feature request
 * Returns the updated like count and liked status
 */
export async function likeFeatureRequest(id: string): Promise<{ likeCount: number; userLiked: boolean }> {
  await delay(200);
  
  const request = mockData.find(req => req.id === id);
  if (!request) {
    throw new Error(`Feature request with id ${id} not found`);
  }
  
  const wasLiked = likedRequestIds.has(id);
  
  if (wasLiked) {
    // Unlike: decrease count and remove from set
    request.likeCount = Math.max(0, request.likeCount - 1);
    likedRequestIds.delete(id);
  } else {
    // Like: increase count and add to set
    request.likeCount += 1;
    likedRequestIds.add(id);
  }
  
  return {
    likeCount: request.likeCount,
    userLiked: !wasLiked,
  };
}

