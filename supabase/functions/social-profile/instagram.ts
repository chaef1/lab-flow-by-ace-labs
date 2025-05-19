
import { waitForApifyRun } from "../_shared/utils.ts";

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
 * Fetches Instagram profile data using Apify
 */
export async function fetchInstagramProfile(username: string, apiKey: string) {
  console.log(`Fetching Instagram profile for user: ${username}`);
  
  try {
    // Using the synchronous API endpoint as specified
    console.log("Attempting to fetch Instagram data with Apify API");
    
    const actorId = 'apify~instagram-profile-scraper';
    
    // Using the run-sync endpoint as specified
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync?token=${apiKey}`;
    console.log(`Using endpoint: ${endpoint}`);
    
    // Modified request body to use 'usernames' parameter as required by the API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'usernames': [username.replace('@', '')],
        'resultsType': 'details',
        'resultsLimit': 1,
        'proxy': {
          'useApifyProxy': true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apify Instagram API error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch Instagram data: ${response.status} ${errorText}`);
    }
    
    // With run-sync, we get results directly in the response
    const result = await response.json();
    console.log(`Got Instagram results directly from sync API`);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.error("No profile data returned from Apify");
      throw new Error("No Instagram profile data returned");
    }
    
    // Instagram profile data structure
    const profile = result[0];
    
    if (!profile || !profile.username) {
      console.error('Instagram profile not found in response');
      throw new Error('Instagram profile not found');
    }
    
    // Map Apify data to our app format
    return {
      username: profile.username,
      full_name: profile.fullName,
      biography: profile.biography || profile.bio,
      follower_count: profile.followersCount || profile.followers,
      following_count: profile.followingCount || profile.following,
      post_count: profile.postsCount || profile.posts,
      is_verified: profile.verified || false,
      profile_pic_url: profile.profilePicUrl || profile.profilePicture,
      // Calculate approximate engagement rate (if posts are available)
      engagement_rate: profile.latestPosts && profile.latestPosts.length > 0 && profile.followersCount > 0
        ? calculateEngagementRate(profile.latestPosts, profile.followersCount)
        : 0,
      is_mock_data: false
    };
    
  } catch (error) {
    console.error("Error in fetchInstagramProfile:", error.message);
    
    // Fallback to mock data when API fails
    console.log("API call failed, generating mock data for Instagram profile");
    
    const mockData = {
      username: username,
      full_name: username.charAt(0).toUpperCase() + username.slice(1),
      biography: `This is a sample bio for @${username}. This profile was created because we couldn't fetch the actual Instagram data.`,
      follower_count: Math.floor(Math.random() * 100000) + 5000,
      following_count: Math.floor(Math.random() * 1000) + 500,
      post_count: Math.floor(Math.random() * 100) + 10,
      is_verified: Math.random() > 0.8,
      profile_pic_url: `https://ui-avatars.com/api/?name=${username}&background=random`,
      engagement_rate: (Math.random() * 5 + 1).toFixed(2),
      is_mock_data: true
    };
    
    return mockData;
  }
}
