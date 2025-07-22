
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
 * Fetches Instagram profile data using the Instagram Graph API and social scraper
 */
export async function fetchInstagramProfile(
  username: string, 
  appId: string, 
  appSecret: string,
  apiKey?: string
) {
  console.log(`Fetching Instagram profile for user: ${username}`);
  
  try {
    // First, try using the social scraper API if key is provided
    if (apiKey) {
      try {
        console.log("Attempting to fetch Instagram profile with dedicated scraper API");
        const scraperUrl = `https://api.apify.com/v2/acts/zuzka~instagram-profile-scraper/run-sync-get-dataset-items?token=${apiKey}`;
        
        const response = await fetch(scraperUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            usernames: [username],
            resultsLimit: 1,
            resultsType: "posts",
            extendOutputFunction: "($) => { return {} }"
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const profile = data[0];
            
            // Extract posts for engagement calculation
            const posts = profile.latestPosts || [];
            
            // Calculate engagement rate
            const engagementRate = calculateEngagementRate(
              posts, 
              profile.followersCount || 0
            );
            
            // Map to our app format
            return {
              username: profile.username,
              full_name: profile.fullName,
              biography: profile.biography,
              follower_count: profile.followersCount || 0,
              following_count: profile.followingCount || 0,
              post_count: profile.postsCount || 0,
              is_verified: profile.verified || false,
              profile_pic_url: profile.profilePicUrl,
              engagement_rate: engagementRate,
              website: profile.websiteUrl,
              posts: posts.map((post: any) => ({
                url: post.url,
                thumbnail: post.displayUrl,
                caption: post.caption,
                likes: post.likesCount,
                comments: post.commentsCount,
                timestamp: post.timestamp,
                type: post.isVideo ? 'video' : 'image'
              }))
            };
          }
        } else {
          console.log("Scraper API returned an error, falling back to other methods");
        }
      } catch (error) {
        console.log("Error using scraper API, falling back to other methods:", error);
      }
    }
    
    // Improved error handling and request strategy
    // We'll make the request with proper headers and retry logic
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Sec-Ch-Ua': '"Not A;Brand";v="99", "Chromium";v="96"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Try with a more resilient approach
    console.log(`Attempting to fetch profile for Instagram user: ${username}`);
    
    // First attempt - direct profile fetch
    try {
      const response = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=1`, { 
        headers,
        redirect: 'follow',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.graphql && data.graphql.user) {
          const user = data.graphql.user;
          
          // Get recent posts for engagement calculation if available
          const posts = user.edge_owner_to_timeline_media?.edges || [];
          
          // Calculate engagement rate
          const engagementRate = posts.length > 0 ? 
            calculateEngagementRate(
              posts.map((post: any) => ({
                likesCount: post.node.edge_liked_by?.count || 0,
                commentsCount: post.node.edge_media_to_comment?.count || 0
              })),
              user.edge_followed_by?.count || 0
            ) : 0;
          
          // Map Instagram data to our app format
          return {
            username: user.username,
            full_name: user.full_name,
            biography: user.biography,
            follower_count: user.edge_followed_by?.count || 0,
            following_count: user.edge_follow?.count || 0,
            post_count: user.edge_owner_to_timeline_media?.count || 0,
            is_verified: user.is_verified || false,
            profile_pic_url: user.profile_pic_url,
            engagement_rate: engagementRate,
            website: user.external_url,
            posts: posts.slice(0, 12).map((post: any) => ({
              url: `https://www.instagram.com/p/${post.node.shortcode}/`,
              thumbnail: post.node.thumbnail_src || post.node.display_url,
              caption: post.node.edge_media_to_caption?.edges[0]?.node?.text || '',
              likes: post.node.edge_liked_by?.count || 0,
              comments: post.node.edge_media_to_comment?.count || 0,
              timestamp: new Date(post.node.taken_at_timestamp * 1000).toISOString(),
              type: post.node.is_video ? 'video' : 'image'
            }))
          };
        }
      }
      
      // If we get a 429 specifically, log it and throw an informative error
      if (response.status === 429) {
        console.error("Instagram API rate limit reached (429)");
        throw new Error("Instagram rate limit reached. Please try again later");
      }
      
      // For other errors, continue to alternate method
      console.log("First method failed, trying alternate approach...");
    } catch (error) {
      console.log("Error in first approach:", error.message);
      // Continue to next approach
    }
    
    // Second attempt - try web scraping approach with different user agent
    try {
      console.log("Trying alternate approach to fetch Instagram profile");
      const response = await fetch(`https://www.instagram.com/${username}/`, {
        headers: {
          ...headers,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Instagram rate limit reached. Please try again later");
        }
        throw new Error(`Instagram profile not found for @${username}`);
      }
      
      const html = await response.text();
      
      // Look for the JSON data that Instagram embeds in their HTML
      const dataMatch = html.match(/<script type="text\/javascript">window\._sharedData = (.+?);<\/script>/);
      
      if (dataMatch && dataMatch[1]) {
        const sharedData = JSON.parse(dataMatch[1]);
        
        // Navigate to the user data in the shared data
        const userData = sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;
        
        if (userData) {
          // Get recent posts for engagement calculation if available
          const posts = userData.edge_owner_to_timeline_media?.edges || [];
          
          // Calculate engagement rate
          const engagementRate = posts.length > 0 ? 
            calculateEngagementRate(
              posts.map((post: any) => ({
                likesCount: post.node.edge_liked_by?.count || 0,
                commentsCount: post.node.edge_media_to_comment?.count || 0
              })),
              userData.edge_followed_by?.count || 0
            ) : 0;
          
          return {
            username: userData.username,
            full_name: userData.full_name,
            biography: userData.biography,
            follower_count: userData.edge_followed_by?.count || 0,
            following_count: userData.edge_follow?.count || 0,
            post_count: userData.edge_owner_to_timeline_media?.count || 0,
            is_verified: userData.is_verified || false,
            profile_pic_url: userData.profile_pic_url,
            engagement_rate: engagementRate,
            website: userData.external_url,
            posts: posts.slice(0, 12).map((post: any) => ({
              url: `https://www.instagram.com/p/${post.node.shortcode}/`,
              thumbnail: post.node.thumbnail_src || post.node.display_url,
              caption: post.node.edge_media_to_caption?.edges[0]?.node?.text || '',
              likes: post.node.edge_liked_by?.count || 0,
              comments: post.node.edge_media_to_comment?.count || 0,
              timestamp: new Date(post.node.taken_at_timestamp * 1000).toISOString(),
              type: post.node.is_video ? 'video' : 'image'
            }))
          };
        }
      }
      
      // Third approach: try to extract with regex as fallback
      const usernameMatcher = html.match(/"username":"([^"]+)"/);
      const followersMatcher = html.match(/"edge_followed_by":{"count":(\d+)}/);
      const followingMatcher = html.match(/"edge_follow":{"count":(\d+)}/);
      const postsMatcher = html.match(/"edge_owner_to_timeline_media":{"count":(\d+)}/);
      const fullNameMatcher = html.match(/"full_name":"([^"]+)"/);
      const bioMatcher = html.match(/"biography":"([^"]+)"/);
      const profilePicMatcher = html.match(/"profile_pic_url":"([^"]+)"/);
      const verifiedMatcher = html.match(/"is_verified":(\w+)/);
      
      if (usernameMatcher) {
        return {
          username: username,
          full_name: fullNameMatcher ? fullNameMatcher[1].replace(/\\u[\dA-Fa-f]{4}/g, '') : username,
          biography: bioMatcher ? bioMatcher[1].replace(/\\u[\dA-Fa-f]{4}/g, '') : '',
          follower_count: followersMatcher ? parseInt(followersMatcher[1]) : 0,
          following_count: followingMatcher ? parseInt(followingMatcher[1]) : 0,
          post_count: postsMatcher ? parseInt(postsMatcher[1]) : 0,
          is_verified: verifiedMatcher ? verifiedMatcher[1] === 'true' : false,
          profile_pic_url: profilePicMatcher ? profilePicMatcher[1].replace(/\\/g, '') : '',
          engagement_rate: 0,
          posts: []
        };
      }

      // If we still don't have data, try the Graph API if we have credentials
      if (appId && appSecret && username) {
        console.log("Attempting to use Graph API as fallback");
        // Note: This method requires the user to authenticate with Instagram
        // This is just showing how it could be implemented if we had a valid access token
        
        // For demonstration only - actual OAuth flow would require a UI component 
        // and user interaction which can't be done directly in an Edge Function
        
        return {
          username: username,
          full_name: "",
          biography: "Profile available via OAuth authentication",
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
    } catch (error) {
      console.error('Error in alternate approach:', error);
      
      // If this was a rate limit error, throw it clearly
      if (error.message.includes("rate limit")) {
        throw error;
      }
      
      // Final fallback - throw a not found error
      throw new Error(`Instagram profile not found for @${username}`);
    }
    
  } catch (error) {
    console.error('Instagram profile fetch error:', error);
    throw new Error(`Failed to fetch Instagram profile: ${error.message}`);
  }
}

/**
 * Fetches Instagram post data for a specific post URL
 * This can be used to get detailed engagement metrics for a specific post
 */
export async function fetchInstagramPost(postUrl: string, apiKey?: string) {
  try {
    console.log(`Fetching Instagram post data for: ${postUrl}`);
    
    if (!apiKey) {
      throw new Error("API key is required to fetch Instagram post data");
    }
    
    // Extract the post ID/shortcode from the URL
    const shortcodeMatch = postUrl.match(/instagram\.com\/p\/([^\/\?#]+)/);
    if (!shortcodeMatch || !shortcodeMatch[1]) {
      throw new Error("Invalid Instagram post URL");
    }
    
    const shortcode = shortcodeMatch[1];
    
    // Use the social scraper API to get detailed post data
    const scraperUrl = `https://api.apify.com/v2/acts/zuzka~instagram-post-scraper/run-sync-get-dataset-items?token=${apiKey}`;
    
    const response = await fetch(scraperUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/p/${shortcode}/`],
        resultsLimit: 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error("No post data found");
    }
    
    const post = data[0];
    
    return {
      id: post.id,
      shortcode: post.shortcode,
      url: post.url,
      type: post.isVideo ? 'video' : 'image',
      caption: post.caption,
      likes_count: post.likesCount,
      comments_count: post.commentsCount,
      timestamp: post.timestamp,
      owner: {
        username: post.ownerUsername,
        id: post.ownerId
      },
      image_url: post.displayUrl,
      video_url: post.videoUrl,
      engagement_rate: post.likesCount && post.ownerFollowersCount ? 
        parseFloat(((post.likesCount + post.commentsCount) / post.ownerFollowersCount * 100).toFixed(2)) : 
        null
    };
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
  const profileUrl = `${INSTAGRAM_GRAPH_URL}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  const mediaUrl = `${INSTAGRAM_GRAPH_URL}/me/media?fields=id,caption,media_type,like_count,comments_count,timestamp&access_token=${accessToken}`

  try {
    const profileRes = await fetch(profileUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    const contentType = profileRes.headers.get("content-type") || ''
    if (!contentType.includes("application/json")) {
      const errorText = await profileRes.text()
      throw new Error(`Non-JSON response: ${errorText}`)
    }

    const profileData = await profileRes.json()

    const mediaRes = await fetch(mediaUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    const mediaType = mediaRes.headers.get("content-type") || ''
    if (!mediaType.includes("application/json")) {
      const errorText = await mediaRes.text()
      throw new Error(`Non-JSON response: ${errorText}`)
    }

    const mediaData = await mediaRes.json()

    return {
      profile: profileData,
      media: mediaData.data
    }
  } catch (error: any) {
    console.error("Error fetching Instagram profile:", error.message || error)
    return {
      error: true,
      message: error.message || 'Unexpected error'
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
