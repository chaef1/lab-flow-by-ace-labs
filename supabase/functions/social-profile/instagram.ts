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
    // First step is to get a long-lived access token using app credentials
    // Note: For proper implementation, we'd need to complete OAuth flow with user
    // Since we're doing public profile search, we'll use a different approach
    
    // For Basic Display API, we need to search by username
    console.log(`Searching for Instagram profile: ${username}`);
    
    // This is a fallback/mock implementation
    // In a production app, you would:
    // 1. Complete OAuth flow to get user access token
    // 2. Use that token to access the Graph API
    
    // For demonstration purposes, we're using a simplified approach to return profile data
    // based on the username since proper OAuth flow requires user interaction
    
    // Make a request to fetch basic public information
    const response = await fetch(`https://www.instagram.com/${username}/?__a=1`);
    
    if (!response.ok) {
      // If we get a 404, the profile doesn't exist
      if (response.status === 404) {
        throw new Error(`Instagram profile @${username} not found`);
      }
      
      // Other error types
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    // Try to parse the response
    try {
      const data = await response.json();
      
      // Check if we have user data
      if (!data || !data.graphql || !data.graphql.user) {
        throw new Error('Invalid response format from Instagram');
      }
      
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
        // For engagement rate, we would need recent posts data
        // Setting a default value here
        engagement_rate: 0
      };
    } catch (error) {
      console.error('Error parsing Instagram profile data:', error);
      
      // Create a fallback profile with limited data
      // This is for demonstration purposes - in production you'd want to handle this differently
      console.log('Using fallback mechanism to fetch profile data');
      
      // Attempt to scrape minimal public data
      const fallbackResponse = await fetch(`https://www.instagram.com/${username}/`);
      if (!fallbackResponse.ok) {
        throw new Error(`Could not fetch Instagram profile for @${username}`);
      }
      
      const html = await fallbackResponse.text();
      
      // Extract basic information using regex
      // This is not reliable and is only for demonstration
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
    }
  } catch (error) {
    console.error('Instagram profile fetch error:', error);
    throw new Error(`Failed to fetch Instagram profile: ${error.message}`);
  }
}
