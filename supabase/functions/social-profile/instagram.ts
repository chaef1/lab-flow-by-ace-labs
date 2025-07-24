
/**
 * Calculates engagement rate from Instagram posts
 */
export function calculateEngagementRate(posts: any[], followersCount: number) {
  if (!posts || posts.length === 0 || followersCount === 0) return 0;
  
  // Calculate average engagement across available posts
  const totalEngagement = posts.reduce((sum, post) => {
    return sum + (post.likesCount || 0) + (post.commentsCount || 0);
  }, 0);
  
  const averageEngagement = totalEngagement / posts.length;
  const engagementRate = (averageEngagement / followersCount) * 100;
  
  return parseFloat(engagementRate.toFixed(2));
}

/**
 * OAuth URLs for Instagram Graph API
 */
const INSTAGRAM_OAUTH_URL = 'https://api.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.facebook.com';

/**
 * Fetches Instagram profile data using the Instagram Graph API with saved access tokens
 */
export async function fetchInstagramProfile(
  username: string, 
  appId: string, 
  appSecret: string,
  accessToken?: string
) {
  console.log(`Fetching Instagram profile for user: ${username}`);
  
  try {
    // Try using Instagram Graph API with provided access token
    if (accessToken) {
      console.log("Attempting to fetch Instagram profile with Graph API access token");
      try {
        // First try to get the user's Instagram business account
        const businessUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`;
        const businessResponse = await fetch(businessUrl);
        const businessData = await businessResponse.json();
        
        if (businessData.data && businessData.data.length > 0) {
          for (const page of businessData.data) {
            if (page.instagram_business_account && page.instagram_business_account.id) {
              const igAccountId = page.instagram_business_account.id;
              
              // Get Instagram business account details
              const profileUrl = `https://graph.facebook.com/v19.0/${igAccountId}?fields=username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website&access_token=${accessToken}`;
              const profileResponse = await fetch(profileUrl);
              const profileData = await profileResponse.json();
              
              if (!profileData.error && profileData.username && profileData.username.toLowerCase() === username.toLowerCase()) {
                // Get recent media for engagement calculation
                const mediaUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media?fields=like_count,comments_count,timestamp,media_type&limit=12&access_token=${accessToken}`;
                const mediaResponse = await fetch(mediaUrl);
                const mediaData = await mediaResponse.json();
                
                let engagementRate = 0;
                if (mediaData.data && mediaData.data.length > 0) {
                  const totalEngagement = mediaData.data.reduce((sum: number, post: any) => {
                    return sum + (post.like_count || 0) + (post.comments_count || 0);
                  }, 0);
                  const avgEngagement = totalEngagement / mediaData.data.length;
                  engagementRate = profileData.followers_count > 0 ? 
                    parseFloat(((avgEngagement / profileData.followers_count) * 100).toFixed(2)) : 0;
                }
                
                return {
                  username: profileData.username,
                  full_name: profileData.name || profileData.username,
                  biography: profileData.biography || '',
                  follower_count: profileData.followers_count || 0,
                  following_count: profileData.follows_count || 0,
                  post_count: profileData.media_count || 0,
                  is_verified: false, // Not available in basic API
                  profile_pic_url: profileData.profile_picture_url || '',
                  engagement_rate: engagementRate,
                  website: profileData.website || '',
                  posts: (mediaData.data || []).map((post: any) => ({
                    url: `https://www.instagram.com/p/${post.id}/`,
                    likes: post.like_count || 0,
                    comments: post.comments_count || 0,
                    timestamp: post.timestamp,
                    type: post.media_type === 'VIDEO' ? 'video' : 'image'
                  }))
                };
              }
            }
          }
        }
        
        // If no business account match, try Instagram Basic Display API
        const basicUrl = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`;
        const basicResponse = await fetch(basicUrl);
        const basicData = await basicResponse.json();
        
        if (!basicData.error && basicData.username && basicData.username.toLowerCase() === username.toLowerCase()) {
          return {
            username: basicData.username,
            full_name: basicData.username,
            biography: '',
            follower_count: 0, // Not available in Basic Display API
            following_count: 0,
            post_count: basicData.media_count || 0,
            is_verified: false,
            profile_pic_url: '',
            engagement_rate: 0,
            website: '',
            posts: []
          };
        }
        
      } catch (apiError) {
        console.log("Graph API error:", apiError);
        // Continue to fallback approach
      }
    }
    
    // If Graph API fails or no token provided, require authentication
    console.log("Instagram Graph API access required for profile data");
    
    if (appId && appSecret) {
      return {
        username: username,
        full_name: "",
        biography: "Connect your Meta account to view detailed Instagram profile data",
        follower_count: 0,
        following_count: 0,
        post_count: 0,
        is_verified: false,
        profile_pic_url: "",
        engagement_rate: 0,
        posts: [],
        requires_auth: true,
        auth_url: `${INSTAGRAM_OAUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent("https://app-sandbox.acelabs.co.za/influencers")}&scope=user_profile,user_media&response_type=code`
      };
    }
    
    // No credentials available
    throw new Error(`Instagram API credentials required to fetch profile for @${username}`);
    
  } catch (error) {
    console.error('Instagram profile fetch error:', error);
    throw new Error(`Failed to fetch Instagram profile: ${error.message}`);
  }
}

/**
 * Fetches Instagram post data for a specific post URL using Graph API
 */
export async function fetchInstagramPost(postUrl: string, accessToken?: string) {
  try {
    console.log(`Fetching Instagram post data for: ${postUrl}`);
    
    if (!accessToken) {
      throw new Error("Meta access token is required to fetch Instagram post data");
    }
    
    // Extract the post ID/shortcode from the URL
    const shortcodeMatch = postUrl.match(/instagram\.com\/p\/([^\/\?#]+)/);
    if (!shortcodeMatch || !shortcodeMatch[1]) {
      throw new Error("Invalid Instagram post URL");
    }
    
    const shortcode = shortcodeMatch[1];
    
    // Note: Instagram Graph API doesn't allow fetching posts by shortcode directly
    // This would require the post to be from a business account that the token has access to
    throw new Error("Instagram post fetching requires the post to be from a connected business account");
    
  } catch (error) {
    console.error('Error fetching Instagram post data:', error);
    throw error;
  }
}

/**
 * These additional functions would be needed for a complete OAuth flow
 * They're included for reference but not used in the current implementation
 */

/**
 * Exchanges an authorization code for an access token
 */
export async function exchangeCodeForToken(code: string, redirectUri: string, appId: string, appSecret: string) {
  const params = new URLSearchParams();
  params.append('client_id', appId);
  params.append('client_secret', appSecret);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', redirectUri);
  params.append('code', code);
  
  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code: ${error.error_message || 'Unknown error'}`);
  }
  
  return await response.json();
}

/**
 * Fetches Instagram profile data using the Instagram Graph API.
 */
export async function fetchInstagramProfileWithToken(userId: string, accessToken: string) {
  console.log(`Fetching Instagram profile for user: ${userId}`);
  console.log(`Access token (first 10 chars): ${accessToken.substring(0, 10)}...`);
  
  const profileUrl = `${INSTAGRAM_GRAPH_URL}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  const mediaUrl = `${INSTAGRAM_GRAPH_URL}/me/media?fields=id,caption,media_type,like_count,comments_count,timestamp&access_token=${accessToken}`

  console.log(`Profile URL: ${INSTAGRAM_GRAPH_URL}/me?fields=id,username,account_type,media_count&access_token=***`);

  try {
    const profileRes = await fetch(profileUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    console.log(`Profile response status: ${profileRes.status}`);
    console.log(`Profile response headers:`, Object.fromEntries(profileRes.headers.entries()));

    const contentType = profileRes.headers.get("content-type") || ''
    
    // Get the response text first to see what we're actually getting
    const responseText = await profileRes.text();
    console.log(`Profile response body (first 200 chars): ${responseText.substring(0, 200)}`);

    if (!contentType.includes("application/json")) {
      console.error(`Expected JSON but got content-type: ${contentType}`);
      console.error(`Full response: ${responseText}`);
      throw new Error(`API returned HTML instead of JSON. Status: ${profileRes.status}. This usually means the access token is invalid or expired. Response: ${responseText.substring(0, 200)}...`)
    }

    let profileData;
    try {
      profileData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Failed to parse JSON: ${parseError}`);
      console.error(`Response text: ${responseText}`);
      throw new Error(`Invalid JSON response from Instagram API: ${responseText.substring(0, 200)}...`);
    }

    // Check if the response contains an error from Facebook
    if (profileData.error) {
      console.error(`Instagram API error:`, profileData.error);
      throw new Error(`Instagram API error: ${profileData.error.message} (Code: ${profileData.error.code})`);
    }

    console.log(`Successfully got profile data for: ${profileData.username || 'unknown'}`);

    const mediaRes = await fetch(mediaUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    console.log(`Media response status: ${mediaRes.status}`);

    const mediaType = mediaRes.headers.get("content-type") || ''
    const mediaText = await mediaRes.text();
    
    if (!mediaType.includes("application/json")) {
      console.error(`Expected JSON for media but got content-type: ${mediaType}`);
      console.error(`Media response: ${mediaText.substring(0, 200)}`);
      // Don't fail completely, just return profile data without media
      return {
        profile: profileData,
        media: [],
        warning: "Could not fetch media data"
      }
    }

    let mediaData;
    try {
      mediaData = JSON.parse(mediaText);
    } catch (parseError) {
      console.error(`Failed to parse media JSON: ${parseError}`);
      return {
        profile: profileData,
        media: [],
        warning: "Could not parse media data"
      }
    }

    return {
      profile: profileData,
      media: mediaData.data || []
    }
  } catch (error: any) {
    console.error("Error fetching Instagram profile:", error.message || error)
    return {
      error: true,
      message: error.message || 'Unexpected error',
      details: error.stack
    }
  }
}

/**
 * Gets a user's profile using a valid access token (legacy function - kept for compatibility)
 */
export async function getProfileWithToken(accessToken: string) {
  const fields = 'id,username,account_type,media_count';
  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/me?fields=${fields}&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get profile: ${error.error?.message || 'Unknown error'}`);
  }
  
  return await response.json();
}

/**
 * Gets a user's media using a valid access token (legacy function - kept for compatibility)
 */
export async function getUserMedia(accessToken: string) {
  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username';
  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/me/media?fields=${fields}&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get media: ${error.error?.message || 'Unknown error'}`);
  }
  
  return await response.json();
}
