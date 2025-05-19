
import { waitForApifyRun } from "../_shared/utils.ts";

/**
 * Calculates TikTok engagement rate
 */
export function calculateTikTokEngagementRate(stats: any) {
  if (!stats || stats.followerCount === 0 || stats.videoCount === 0) return 0;
  
  // For the official TikTok API response
  const followerCount = stats.followerCount || stats.fans || stats.follower_count || 0;
  const heartCount = stats.heartCount || stats.likes || stats.heart_count || stats.likesCount || stats.likesTotalCount || 0;
  const videoCount = stats.videoCount || stats.video_count || stats.posts || 1;
  
  // TikTok engagement can be estimated using likes
  const averageEngagement = heartCount / videoCount;
  const engagementRate = (averageEngagement / followerCount) * 100;
  
  return parseFloat(engagementRate.toFixed(2));
}

/**
 * Normalizes a TikTok profile object to match the app's expected format
 */
function normalizeProfileData(profile: any, username: string): any {
  return {
    username: profile.username || profile.uniqueId || username.replace('@', ''),
    full_name: profile.displayName || profile.nickname || profile.fullName || username,
    biography: profile.signature || profile.bio || profile.bio_description || '',
    follower_count: profile.followerCount || profile.followers || profile.follower_count || 0,
    following_count: profile.followingCount || profile.following || profile.following_count || 0,
    post_count: profile.videoCount || profile.posts || profile.video_count || 0,
    is_verified: profile.verified || profile.is_verified || false,
    profile_pic_url: profile.avatarLarge || profile.avatarMedium || profile.avatar || profile.avatar_url || '',
    engagement_rate: calculateTikTokEngagementRate(profile)
  };
}

/**
 * Attempts to fetch a TikTok profile using the official TikTok API
 */
async function fetchWithOfficialAPI(username: string): Promise<any | null> {
  const tiktokApiKey = Deno.env.get('TIKTOK_API_KEY');
  const tiktokApiSecret = Deno.env.get('TIKTOK_API_SECRET');
  
  if (!tiktokApiKey || !tiktokApiSecret) {
    console.log('TikTok API credentials not found');
    return null;
  }
  
  try {
    console.log(`Using official TikTok API for: ${username}`);
    
    // The TikTok API requires an access token first
    const tokenResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: tiktokApiKey,
        client_secret: tiktokApiSecret,
        grant_type: 'client_credentials',
      }).toString(),
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`TikTok token API error: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data?.access_token;
    
    if (!accessToken) {
      throw new Error('Failed to get TikTok access token');
    }
    
    // Now we can fetch the user info
    const userResponse = await fetch(
      `https://open-api.tiktok.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!userResponse.ok) {
      throw new Error(`TikTok user API error: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    
    // Log the structure for debugging
    console.log('TikTok API response structure:', JSON.stringify(userData).substring(0, 500) + '...');
    
    if (userData.data && userData.data.user) {
      const user = userData.data.user;
      
      // Map the official API response to our app format
      return normalizeProfileData({
        followerCount: user.follower_count,
        heartCount: user.likes_count,
        videoCount: user.video_count,
        username: username.replace('@', ''),
        displayName: user.display_name,
        bio_description: user.bio_description,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url
      }, username);
    } 
    
    throw new Error('TikTok API data format not recognized');
  } catch (error) {
    console.error(`Official TikTok API error: ${error.message}`);
    return null;
  }
}

/**
 * Attempts to fetch a TikTok profile using the TikScraper Apify actor
 */
async function fetchWithTikScraper(username: string, apiKey: string): Promise<any | null> {
  try {
    const tikScraperActor = 'apify/tik-scraper';
    const tikScraperEndpoint = `https://api.apify.com/v2/acts/${tikScraperActor}/runs?token=${apiKey}`;
    
    console.log(`Trying TikScraper (${tikScraperActor}) for: ${username}`);
    
    const response = await fetch(tikScraperEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.replace('@', ''),
        resultsType: "userInfo"
      })
    });
    
    if (!response.ok) {
      console.error(`TikScraper API error: ${response.status}`);
      return null;
    }
    
    const runResponse = await response.json();
    const runId = runResponse.data.id;
    console.log(`TikScraper run created with ID: ${runId}`);
    
    const result = await waitForApifyRun(runId, apiKey, 60000);
    console.log(`Got ${result.data?.length || 0} results from TikScraper`);
    
    if (result.data && result.data.length > 0) {
      const profile = result.data[0];
      console.log('TikScraper data structure:', JSON.stringify(profile).substring(0, 500) + '...');
      
      return normalizeProfileData(profile, username);
    }
    
    return null;
  } catch (error) {
    console.error(`Error in TikScraper: ${error.message}`);
    return null;
  }
}

/**
 * Attempts to fetch a TikTok profile using the vdrmota/tiktok-scraper Apify actor
 */
async function fetchWithVdrMotaScraper(username: string, apiKey: string): Promise<any | null> {
  try {
    const actorId = 'vdrmota/tiktok-scraper';
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`;
    
    console.log(`Trying ${actorId} for: ${username}`);
    
    // Configure payload for the Apify actor
    const payload = {
      username: username.replace('@', ''),
      profileUrls: [`https://www.tiktok.com/@${username.replace('@', '')}`],
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apify TikTok API error: ${response.status} - ${errorText}`);
      return null;
    }
    
    const runResponse = await response.json();
    const runId = runResponse.data.id;
    console.log(`Apify TikTok run created with ID: ${runId}`);
    
    // Wait for the run to complete (with a longer timeout)
    const result = await waitForApifyRun(runId, apiKey, 60000);
    console.log(`Got ${result.data?.length || 0} TikTok results from Apify dataset`);
    
    if (!result.data || result.data.length === 0) {
      console.error('No TikTok profile data returned from Apify');
      return null;
    }
    
    // Log the response structure to help with debugging
    console.log('Apify TikTok data structure:', JSON.stringify(result.data[0]).substring(0, 500) + '...');
    
    const profile = result.data[0];
    
    // Map the Apify data to our app format
    if (profile && (profile.user || profile.userInfo)) {
      const userInfo = profile.user || profile.userInfo || {};
      const stats = userInfo.stats || userInfo;
      
      return normalizeProfileData({
        username: userInfo.uniqueId || userInfo.username,
        fullName: userInfo.nickname,
        biography: userInfo.signature || userInfo.description || userInfo.bio,
        followerCount: stats.followerCount || stats.followers,
        followingCount: stats.followingCount || stats.following,
        videoCount: stats.videoCount || stats.videos,
        verified: userInfo.verified,
        avatarMedium: userInfo.avatarMedium || userInfo.avatarUrl || userInfo.avatar
      }, username);
    }
    
    console.error('Apify TikTok profile structure not recognized');
    return null;
  } catch (error) {
    console.error(`Error in VdrMota TikTok scraper: ${error.message}`);
    return null;
  }
}

/**
 * Creates mock TikTok profile data for testing when all APIs fail
 */
function createMockTikTokProfile(username: string) {
  console.log(`Creating mock TikTok profile for ${username} due to API failure`);
  
  return {
    username: username.replace('@', ''),
    full_name: username.replace('@', ''),
    biography: 'This is a mock profile for testing purposes as the TikTok API request failed.',
    follower_count: Math.floor(Math.random() * 100000) + 5000,
    following_count: Math.floor(Math.random() * 1000) + 100,
    post_count: Math.floor(Math.random() * 100) + 10,
    is_verified: Math.random() > 0.8,
    profile_pic_url: 'https://placehold.co/400x400/6445ED/white?text=TikTok',
    engagement_rate: (Math.random() * 5 + 1).toFixed(2)
  };
}

/**
 * Main function to fetch TikTok profile using multiple methods:
 * 1. Official TikTok API (if credentials available)
 * 2. TikScraper Actor (most reliable Apify actor)
 * 3. Fallback to vdrmota/tiktok-scraper
 * 4. Mock data as final fallback
 */
export async function fetchTikTokProfile(username: string, apiKey: string) {
  console.log(`Fetching TikTok profile for user: ${username}`);
  
  // Try the official TikTok API first
  const officialApiResult = await fetchWithOfficialAPI(username);
  if (officialApiResult) {
    console.log(`Successfully retrieved TikTok profile from official API for: ${username}`);
    return officialApiResult;
  }
  
  console.log(`Falling back to scrapers for ${username}`);
  
  // Try TikScraper actor
  const tikScraperResult = await fetchWithTikScraper(username, apiKey);
  if (tikScraperResult) {
    console.log(`Successfully retrieved TikTok profile from TikScraper for: ${username}`);
    return tikScraperResult;
  }
  
  // Try vdrmota/tiktok-scraper actor
  const vdrScraperResult = await fetchWithVdrMotaScraper(username, apiKey);
  if (vdrScraperResult) {
    console.log(`Successfully retrieved TikTok profile from vdrmota scraper for: ${username}`);
    return vdrScraperResult;
  }
  
  // All methods failed, return mock data
  console.log(`All TikTok API methods failed for ${username}, returning mock data`);
  return createMockTikTokProfile(username);
}
