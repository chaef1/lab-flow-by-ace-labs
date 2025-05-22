
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
    console.log(`Processing ${action} with query: ${query}`)

    // Create authenticated Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    if (action === 'search_creators') {
      // Get access token from the current user's Meta connection if not provided
      let metaAccessToken = accessToken;
      
      if (!metaAccessToken) {
        // In a real implementation, you'd retrieve the saved access token
        // associated with the authenticated user
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
      
      console.log('Making request to Instagram Graph API with token:', metaAccessToken?.substring(0, 5) + '...');
      
      try {
        // The Instagram Graph API has significant restrictions on searching for users
        // Most apps don't have the necessary permissions, so we'll try a different approach
        
        // Instead of using the hashtag search endpoint which requires special permissions,
        // we'll try to get business account information if we have an account ID
        if (accountId) {
          try {
            const businessUrl = `https://graph.facebook.com/v19.0/${accountId}?fields=instagram_business_account&access_token=${metaAccessToken}`;
            const businessResponse = await fetch(businessUrl);
            const businessData = await businessResponse.json();
            
            if (businessData.instagram_business_account && businessData.instagram_business_account.id) {
              console.log('Found Instagram business account:', businessData.instagram_business_account.id);
              // You could do more with this business account ID
            }
          } catch (bizError) {
            console.log('Error fetching business account:', bizError);
            // Continue to fallback approach
          }
        }
        
        // For demo purposes, try a direct search for the username
        // Note: This will only work if you have advanced access permissions from Meta
        try {
          const searchUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?q=${encodeURIComponent(query)}&access_token=${metaAccessToken}`;
          const response = await fetch(searchUrl);
          const data = await response.json();
          
          // If this works, great! But most apps won't have these permissions
          if (!data.error && data.data && data.data.length > 0) {
            console.log('Search success:', data);
            return formatResponse({
              success: true,
              data: data.data
            });
          } else if (data.error) {
            console.log('Search error (expected for most apps):', data.error.message);
          }
        } catch (searchError) {
          console.log('Search error:', searchError);
          // Continue to fallback approach
        }
        
        // If all API attempts fail, fall back to mock data
        console.log('Falling back to mock data for demonstration');
        const mockCreators = generateMockCreators(query);
        
        return formatResponse({
          success: true,
          data: mockCreators,
          note: "Using mock data - to use real data, you need to apply for Instagram Graph API permissions"
        });
        
      } catch (apiError) {
        console.error('Error calling Instagram API:', apiError);
        
        // Fall back to mock data for demonstration purposes
        console.log('Falling back to mock data due to API error');
        const mockCreators = generateMockCreators(query);
        
        return formatResponse({
          success: true,
          data: mockCreators,
          note: "Using mock data due to API error - in production, you would need proper Instagram Graph API permissions"
        });
      }
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
// This will be removed when proper API integration is complete
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
    }
  ];
  
  // If query matches exact username, prioritize that match
  const exactMatch = influencers.find(influencer => 
    influencer.username.toLowerCase() === query.toLowerCase()
  );
  
  if (exactMatch) {
    return [exactMatch];
  }
  
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
