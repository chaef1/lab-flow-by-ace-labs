
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
 * Fetches Instagram profile data using the Instagram Graph API
 */
export async function fetchInstagramProfile(username: string, appId: string, appSecret: string) {
  console.log(`Fetching Instagram profile for user: ${username}`);
  
  try {
    // Improved error handling and request strategy
    // We'll make the request with proper headers and retry logic
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; InstagramBot/1.0)',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache'
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
            engagement_rate: 0
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
    
    // Second attempt - try web scraping approach
    try {
      console.log("Trying alternate approach to fetch Instagram profile");
      const response = await fetch(`https://www.instagram.com/${username}/`, {
        headers: {
          ...headers,
          // Add additional headers that might help with scraping
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
          return {
            username: userData.username,
            full_name: userData.full_name,
            biography: userData.biography,
            follower_count: userData.edge_followed_by?.count || 0,
            following_count: userData.edge_follow?.count || 0,
            post_count: userData.edge_owner_to_timeline_media?.count || 0,
            is_verified: userData.is_verified || false,
            profile_pic_url: userData.profile_pic_url,
            engagement_rate: 0
          };
        }
      }
      
      // If we couldn't extract from shared data, try regex approach as fallback
      const usernameMatcher = html.match(/"username":"([^"]+)"/);
      const followersMatcher = html.match(/"edge_followed_by":{"count":(\d+)}/);
      const followingMatcher = html.match(/"edge_follow":{"count":(\d+)}/);
      const postsMatcher = html.match(/"edge_owner_to_timeline_media":{"count":(\d+)}/);
      const fullNameMatcher = html.match(/"full_name":"([^"]+)"/);
      const bioMatcher = html.match(/"biography":"([^"]+)"/);
      const profilePicMatcher = html.match(/"profile_pic_url":"([^"]+)"/);
      const verifiedMatcher = html.match(/"is_verified":(\w+)/);
      
      return {
        username: username,
        full_name: fullNameMatcher ? fullNameMatcher[1].replace(/\\u[\dA-Fa-f]{4}/g, '') : username,
        biography: bioMatcher ? bioMatcher[1].replace(/\\u[\dA-Fa-f]{4}/g, '') : '',
        follower_count: followersMatcher ? parseInt(followersMatcher[1]) : 0,
        following_count: followingMatcher ? parseInt(followingMatcher[1]) : 0,
        post_count: postsMatcher ? parseInt(postsMatcher[1]) : 0,
        is_verified: verifiedMatcher ? verifiedMatcher[1] === 'true' : false,
        profile_pic_url: profilePicMatcher ? profilePicMatcher[1].replace(/\\/g, '') : '',
        engagement_rate: 0
      };
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
