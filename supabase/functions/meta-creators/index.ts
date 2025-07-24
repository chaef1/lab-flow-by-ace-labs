
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
        // Try multiple approaches to find Instagram profiles
        const creators = [];
        
        // 1. First, get all pages (business accounts) accessible with this token
        try {
          const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token=${metaAccessToken}`;
          const pagesResponse = await fetch(pagesUrl);
          const pagesData = await pagesResponse.json();
          
          if (pagesData.data && pagesData.data.length > 0) {
            for (const page of pagesData.data) {
              if (page.instagram_business_account && page.instagram_business_account.id) {
                const igAccountId = page.instagram_business_account.id;
                
                // Get detailed Instagram business account info with more fields
                try {
                  const profileUrl = `https://graph.facebook.com/v19.0/${igAccountId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website,account_type,is_verified_user&access_token=${metaAccessToken}`;
                  const profileResponse = await fetch(profileUrl);
                  const profileData = await profileResponse.json();
                  
                  if (!profileData.error && profileData.username) {
                    // Check if this profile matches our search query
                    const username = profileData.username.toLowerCase();
                    const searchQuery = query.toLowerCase();
                    const name = (profileData.name || '').toLowerCase();
                    const bio = (profileData.biography || '').toLowerCase();
                    
                    if (username.includes(searchQuery) || name.includes(searchQuery) || bio.includes(searchQuery)) {
                      // Auto-categorize based on follower count
                      let tier = 'Business Account';
                      const followerCount = profileData.followers_count || 0;
                      
                      if (followerCount >= 1000000) {
                        tier = 'Celebrity/Elite';
                      } else if (followerCount >= 100001) {
                        tier = 'Macro';
                      } else if (followerCount >= 50001) {
                        tier = 'Mid-Tier';
                      } else if (followerCount >= 10001) {
                        tier = 'Micro';
                      } else if (followerCount >= 1000) {
                        tier = 'Nano';
                      }
                      
                      creators.push({
                        id: igAccountId,
                        name: profileData.name || profileData.username,
                        username: profileData.username,
                        profile_picture_url: profileData.profile_picture_url || '',
                        follower_count: profileData.followers_count || 0,
                        following_count: profileData.follows_count || 0,
                        media_count: profileData.media_count || 0,
                        biography: profileData.biography || '',
                        is_verified: profileData.is_verified_user || false,
                        website: profileData.website || '',
                        account_type: profileData.account_type || 'BUSINESS',
                        category: tier
                      });
                    }
                  }
                } catch (profileError) {
                  console.log('Error fetching profile details:', profileError);
                  continue;
                }
              }
            }
          }
        } catch (searchError) {
          console.log('Error searching connected accounts:', searchError);
        }
        
        // 2. Try to search Instagram Basic Display API for personal accounts (if user authorized)
        try {
          const userUrl = `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${metaAccessToken}`;
          const userResponse = await fetch(userUrl);
          const userData = await userResponse.json();
          
          if (!userData.error && userData.name) {
            const searchQuery = query.toLowerCase();
            const name = userData.name.toLowerCase();
            
            if (name.includes(searchQuery)) {
              creators.push({
                id: userData.id,
                name: userData.name,
                username: userData.name.replace(/\s+/g, '').toLowerCase(),
                profile_picture_url: '',
                follower_count: 0,
                following_count: 0,
                media_count: 0,
                biography: 'Personal Facebook Account',
                is_verified: false,
                website: '',
                account_type: 'PERSONAL',
                category: 'Personal Account'
              });
            }
          }
        } catch (personalError) {
          console.log('Error searching personal account:', personalError);
        }
        
        // If no connected accounts match, try Instagram Graph API discovery endpoints
        // Note: Most discovery endpoints require advanced permissions
        try {
          console.log('Attempting Instagram Graph API discovery (requires advanced permissions)');
          
          // Try hashtag search if available (requires special permissions)
          const hashtagUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?q=${encodeURIComponent(query)}&access_token=${metaAccessToken}`;
          const hashtagResponse = await fetch(hashtagUrl);
          const hashtagData = await hashtagResponse.json();
          
          if (!hashtagData.error && hashtagData.data && hashtagData.data.length > 0) {
            console.log('Hashtag search successful');
            return formatResponse({
              success: true,
              data: hashtagData.data.map((hashtag: any) => ({
                id: hashtag.id,
                name: hashtag.name,
                username: hashtag.name,
                profile_picture_url: '',
                follower_count: 0,
                media_count: 0,
                biography: 'Found via hashtag search',
                is_verified: false,
                category: 'Hashtag'
              }))
            });
          }
        } catch (discoveryError) {
          console.log('Discovery API not available (requires advanced permissions):', discoveryError);
        }
        
        // Return creators if found, otherwise empty results with explanation
        if (creators.length > 0) {
          console.log(`Found ${creators.length} matching creators`);
          return formatResponse({
            success: true,
            data: creators
          });
        }
        
        return formatResponse({
          success: true,
          data: [],
          note: "No matching creators found in connected accounts. Instagram Graph API discovery features require advanced permissions from Meta."
        });
        
      } catch (apiError) {
        console.error('Error calling Instagram Graph API:', apiError);
        
        return formatResponse({
          success: false,
          error: "Instagram Graph API error. Please check your access token and permissions."
        }, 500);
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

