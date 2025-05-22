
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
        // First try to search for business discovery if account ID is provided
        if (accountId) {
          const instagramBusinessUrl = `https://graph.facebook.com/v19.0/${accountId}/business_users?access_token=${metaAccessToken}`;
          const businessResponse = await fetch(instagramBusinessUrl);
          const businessData = await businessResponse.json();
          
          if (businessData.data && businessData.data.length > 0) {
            console.log('Found business users:', businessData.data.length);
          }
        }
        
        // Use Instagram Graph API search to find users
        // Note: This endpoint requires special permissions from Meta
        const searchUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${accountId || 'me'}&q=${encodeURIComponent(query)}&access_token=${metaAccessToken}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.error) {
          console.error('Instagram API error:', data.error);
          
          // If we get a specific error about permissions, let's make a note
          if (data.error.code === 200 || data.error.message.includes('permission')) {
            console.log('This API requires special permissions from Meta. Falling back to mock data for demonstration.');
            
            // For demo/development purposes only - in production this would be removed
            const mockCreators = generateMockCreators(query);
            
            return formatResponse({
              success: true,
              data: mockCreators,
              note: "This is using mock data - to use real data, you need to apply for Instagram Graph API permissions"
            });
          }
          
          return formatResponse({
            error: data.error.message || 'Instagram API error'
          }, 400);
        }
        
        console.log('Instagram search results:', data);
        
        // If we have results, fetch more details for each user
        if (data.data && data.data.length > 0) {
          const creators = [];
          
          for (const item of data.data) {
            // Fetch user details
            const userUrl = `https://graph.facebook.com/v19.0/${item.id}?fields=id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count&access_token=${metaAccessToken}`;
            
            const userResponse = await fetch(userUrl);
            const userData = await userResponse.json();
            
            if (!userData.error) {
              creators.push({
                id: userData.id,
                username: userData.username,
                name: userData.name,
                profile_picture_url: userData.profile_picture_url,
                biography: userData.biography,
                follower_count: userData.followers_count,
                following_count: userData.follows_count,
                media_count: userData.media_count,
                is_verified: userData.is_verified || false,
                category: userData.category || ''
              });
            }
          }
          
          return formatResponse({
            success: true,
            data: creators
          });
        } else {
          // If no results or API issues, fall back to mock data for demo
          console.log('No results from Instagram API, using mock data for demo');
          const mockCreators = generateMockCreators(query);
          
          return formatResponse({
            success: true,
            data: mockCreators,
            note: "Using mock data - no results from Instagram API"
          });
        }
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
