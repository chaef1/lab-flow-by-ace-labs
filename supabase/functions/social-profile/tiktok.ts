
import { waitForApifyRun } from "../_shared/utils.ts";

/**
 * Calculates TikTok engagement rate
 */
export function calculateTikTokEngagementRate(stats: any) {
  if (!stats || stats.followerCount === 0 || stats.videoCount === 0) return 0;
  
  // For the free-tiktok-scraper, we need to use different fields
  const followerCount = stats.followerCount || 0;
  const heartCount = stats.heartCount || stats.likesCount || stats.likesTotalCount || 0;
  const videoCount = stats.videoCount || 1;
  
  // TikTok engagement can be estimated using likes
  const averageEngagement = heartCount / videoCount;
  const engagementRate = (averageEngagement / followerCount) * 100;
  
  return parseFloat(engagementRate.toFixed(2));
}

/**
 * Fetches TikTok profile data using the free TikTok scraper
 */
export async function fetchTikTokProfile(username: string, apiKey: string) {
  console.log(`Fetching TikTok profile for user: ${username}`);
  
  // Use the exact endpoint provided
  const endpoint = `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/runs?token=${apiKey}`;
  console.log(`Using TikTok endpoint: ${endpoint}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'startUrls': [`https://www.tiktok.com/@${username.replace('@', '')}`],
      'maxProfileCount': 1,
      'disableStatistics': false
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`TikTok API error: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch TikTok data: ${errorText}`);
  }
  
  const runResponse = await response.json();
  const runId = runResponse.data.id;
  console.log(`TikTok run created with ID: ${runId}`);
  
  // Wait for the run to complete and get the results
  const result = await waitForApifyRun(runId, apiKey);
  console.log(`Got ${result.data.length} TikTok results from dataset`);
  console.log('TikTok data structure:', JSON.stringify(result.data[0]).substring(0, 500) + '...');
  
  const profile = result.data[0];
  
  if (!profile || !profile.userInfo) {
    console.error('TikTok profile not found in response');
    console.log('TikTok profile response:', JSON.stringify(result.data));
    throw new Error('TikTok profile not found');
  }
  
  const userInfo = profile.userInfo;
  
  // Map the free TikTok scraper data to our app format
  return {
    username: userInfo.username || userInfo.uniqueId || username.replace('@', ''),
    full_name: userInfo.nickname || userInfo.fullName || '',
    biography: userInfo.signature || userInfo.description || '',
    follower_count: userInfo.followerCount || 0,
    following_count: userInfo.followingCount || 0, 
    post_count: userInfo.videoCount || 0,
    is_verified: userInfo.verified || false,
    profile_pic_url: userInfo.avatarMedium || userInfo.avatarUrl || '',
    engagement_rate: calculateTikTokEngagementRate(userInfo)
  };
}
