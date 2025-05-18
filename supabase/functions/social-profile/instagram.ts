
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
  const actorId = 'apify/instagram-profile-scraper';
  
  // Call Apify API
  const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'startUrls': [{ 'url': `https://instagram.com/${username.replace('@', '')}` }],
      'resultsType': 'details',
      'resultsLimit': 1,
      'waitUntilReady': true
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Apify Instagram API error: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch Instagram data: ${errorText}`);
  }
  
  const runResponse = await response.json();
  const runId = runResponse.data.id;
  console.log(`Instagram run created with ID: ${runId}`);
  
  // Wait for the run to complete and get the results
  const result = await waitForApifyRun(runId, apiKey);
  console.log(`Got ${result.data.length} Instagram results from dataset`);
  
  // Instagram profile data structure
  const profile = result.data[0];
  
  if (!profile || !profile.username) {
    console.error('Instagram profile not found in response');
    throw new Error('Instagram profile not found');
  }
  
  // Map Apify data to our app format
  return {
    username: profile.username,
    full_name: profile.fullName,
    biography: profile.biography,
    follower_count: profile.followersCount,
    following_count: profile.followingCount,
    post_count: profile.postsCount,
    is_verified: profile.verified,
    profile_pic_url: profile.profilePicUrl,
    // Calculate approximate engagement rate (if posts are available)
    engagement_rate: profile.latestPosts && profile.latestPosts.length > 0 && profile.followersCount > 0
      ? calculateEngagementRate(profile.latestPosts, profile.followersCount)
      : 0
  };
}
