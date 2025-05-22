
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders, formatResponse } from '../_shared/utils.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

// Function to search for Instagram creators through Meta Graph API
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, query, accessToken, accountId } = await req.json()

    // Create authenticated Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    if (action === 'search_creators') {
      // Get access token from the current user's Meta connection if not provided
      let metaAccessToken = accessToken;
      
      if (!metaAccessToken) {
        // In a real implementation, you'd retrieve the saved access token
        // associated with the authenticated user. This is a simplified example.
        const { data: savedTokenData, error: tokenError } = await supabase
          .from('meta_tokens')
          .select('access_token')
          .eq('valid', true)
          .limit(1)
          .single();
          
        if (tokenError) {
          return formatResponse({ error: 'No valid Meta access token found' }, 400);
        }
        
        metaAccessToken = savedTokenData.access_token;
      }
      
      // Make request to Instagram Graph API to search creators
      // This is a mock implementation since we can't directly search creators this way
      // In production, this would use Meta's Business Discovery API or similar
      
      // For development purposes, generating mock data
      const mockCreators = generateMockCreators(query);
      
      return formatResponse({
        success: true,
        data: mockCreators
      });
    }
    
    return formatResponse({
      error: 'Unknown action'
    }, 400);
  } catch (error) {
    console.error('Error:', error);
    return formatResponse({
      error: error.message || 'Unknown error occurred'
    }, 500);
  }
});

// Helper function to generate mock creator data based on search query
// In production, this would be replaced with actual API calls to Meta
function generateMockCreators(query: string) {
  const searchTerms = query.toLowerCase().split(' ');
  
  // Base set of influencers to filter from
  const influencers = [
    {
      id: '123456789',
      name: 'Sarah Johnson',
      username: 'sarah_lifestyle',
      profile_picture_url: 'https://randomuser.me/api/portraits/women/20.jpg',
      follower_count: 165000,
      media_count: 342,
      biography: 'Lifestyle blogger, fashion enthusiast, and coffee addict',
      is_verified: true,
      category: 'Lifestyle'
    },
    {
      id: '234567890',
      name: 'Mike Chen',
      username: 'mikefitness',
      profile_picture_url: 'https://randomuser.me/api/portraits/men/32.jpg',
      follower_count: 890000,
      media_count: 560,
      biography: 'Fitness coach helping you achieve your health goals',
      is_verified: true,
      category: 'Fitness'
    },
    {
      id: '345678901',
      name: 'Emma Wilson',
      username: 'emma_travels',
      profile_picture_url: 'https://randomuser.me/api/portraits/women/44.jpg',
      follower_count: 432000,
      media_count: 278,
      biography: 'Travel blogger exploring the world one country at a time ✈️',
      is_verified: false,
      category: 'Travel'
    },
    {
      id: '456789012',
      name: 'Alex Thompson',
      username: 'alex_tech',
      profile_picture_url: 'https://randomuser.me/api/portraits/men/67.jpg',
      follower_count: 215000,
      media_count: 189,
      biography: 'Tech reviewer and gadget enthusiast',
      is_verified: false,
      category: 'Technology'
    },
    {
      id: '567890123',
      name: 'Jessica Lee',
      username: 'jessica_beauty',
      profile_picture_url: 'https://randomuser.me/api/portraits/women/91.jpg',
      follower_count: 1200000,
      media_count: 420,
      biography: 'Beauty influencer sharing makeup tips and product reviews',
      is_verified: true,
      category: 'Beauty'
    },
    {
      id: '678901234',
      name: 'David Miller',
      username: 'david_photography',
      profile_picture_url: 'https://randomuser.me/api/portraits/men/22.jpg',
      follower_count: 345000,
      media_count: 612,
      biography: 'Photographer capturing moments and telling stories through images',
      is_verified: false,
      category: 'Photography'
    },
    {
      id: '789012345',
      name: 'Sophia Garcia',
      username: 'sophia_fashion',
      profile_picture_url: 'https://randomuser.me/api/portraits/women/28.jpg',
      follower_count: 950000,
      media_count: 387,
      biography: 'Fashion stylist and trendsetter based in NYC',
      is_verified: true,
      category: 'Fashion'
    },
    {
      id: '890123456',
      name: 'Ryan Jackson',
      username: 'ryan_gaming',
      profile_picture_url: 'https://randomuser.me/api/portraits/men/36.jpg',
      follower_count: 2100000,
      media_count: 275,
      biography: 'Professional gamer and content creator',
      is_verified: true,
      category: 'Gaming'
    },
  ];
  
  // Filter influencers based on search terms
  return influencers.filter(influencer => {
    return searchTerms.some(term =>
      influencer.name.toLowerCase().includes(term) ||
      influencer.username.toLowerCase().includes(term) ||
      influencer.biography?.toLowerCase().includes(term) ||
      influencer.category?.toLowerCase().includes(term)
    );
  });
}
