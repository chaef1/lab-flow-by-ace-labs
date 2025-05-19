
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
    console.log('TikTok API credentials not found. Check TIKTOK_API_KEY and TIKTOK_API_SECRET env variables.');
    return null;
  }
  
  try {
    console.log(`Using official TikTok API for: ${username} (credentials present)`);
    
    // The TikTok API requires an access token first
    console.log('Step 1: Requesting access token from TikTok API...');
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
      const tokenErrorText = await tokenResponse.text();
      console.error(`TikTok token API error: ${tokenResponse.status} - ${tokenErrorText}`);
      return null;
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token response structure:', JSON.stringify(tokenData).substring(0, 300));
    
    const accessToken = tokenData.data?.access_token;
    
    if (!accessToken) {
      console.error('Failed to get TikTok access token. Response:', JSON.stringify(tokenData).substring(0, 300));
      return null;
    }
    
    console.log('Step 2: Successfully obtained access token, now fetching user info...');
    
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
      const userErrorText = await userResponse.text();
      console.error(`TikTok user API error: ${userResponse.status} - ${userErrorText}`);
      return null;
    }
    
    const userData = await userResponse.json();
    
    // Log the structure for debugging
    console.log('TikTok API response structure:', JSON.stringify(userData).substring(0, 500) + '...');
    
    if (userData.data && userData.data.user) {
      console.log('Successfully retrieved user data from official TikTok API');
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
    
    console.error('TikTok API returned invalid data format:', JSON.stringify(userData).substring(0, 300));
    return null;
  } catch (error) {
    console.error(`Official TikTok API error: ${error.message}`);
    console.error('Stack trace:', error.stack);
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
    
    console.log(`Trying TikScraper (${tikScraperActor}) for: ${username} with API key: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    
    // Validate API key
    if (!apiKey || apiKey.length < 10) { // Basic validation
      console.error('Invalid or missing Apify API key for TikScraper');
      return null;
    }
    
    console.log('Step 1: Starting Apify TikScraper actor run...');
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
    
    // Log the full response for debugging
    const responseText = await response.text();
    console.log(`TikScraper API response (${response.status}):`, responseText.substring(0, 300));
    
    if (!response.ok) {
      console.error(`TikScraper API error: ${response.status}`);
      return null;
    }
    
    // Parse the response text as JSON
    const runResponse = JSON.parse(responseText);
    const runId = runResponse.data?.id;
    
    if (!runId) {
      console.error('No run ID received from TikScraper');
      return null;
    }
    
    console.log(`Step 2: TikScraper run created with ID: ${runId}, waiting for results...`);
    
    const result = await waitForApifyRun(runId, apiKey, 60000);
    console.log(`Got ${result.data?.length || 0} results from TikScraper`);
    
    if (result.data && result.data.length > 0) {
      const profile = result.data[0];
      console.log('TikScraper data structure:', JSON.stringify(profile).substring(0, 500) + '...');
      
      return normalizeProfileData(profile, username);
    }
    
    console.log('TikScraper returned no results for username:', username);
    return null;
  } catch (error) {
    console.error(`Error in TikScraper: ${error.message}`);
    console.error('Stack trace:', error.stack);
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
    
    console.log(`Trying ${actorId} for: ${username} with API key: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    
    // Validate API key
    if (!apiKey || apiKey.length < 10) { // Basic validation
      console.error('Invalid or missing Apify API key for vdrmota scraper');
      return null;
    }
    
    // Configure payload for the Apify actor
    const payload = {
      username: username.replace('@', ''),
      profileUrls: [`https://www.tiktok.com/@${username.replace('@', '')}`],
    };
    
    console.log('Step 1: Starting vdrmota TikTok scraper run with payload:', JSON.stringify(payload));
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Log the full response for debugging
    const responseText = await response.text();
    console.log(`vdrmota API response (${response.status}):`, responseText.substring(0, 300));
    
    if (!response.ok) {
      console.error(`Apify TikTok API error: ${response.status} - ${responseText}`);
      return null;
    }
    
    // Parse the response text as JSON
    const runResponse = JSON.parse(responseText);
    const runId = runResponse.data?.id;
    
    if (!runId) {
      console.error('No run ID received from vdrmota scraper');
      return null;
    }
    
    console.log(`Step 2: Apify TikTok run created with ID: ${runId}, waiting for results...`);
    
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
    console.error('Stack trace:', error.stack);
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
 * Checks that all required TikTok API credentials are properly configured
 */
function checkTikTokApiCredentials(): boolean {
  console.log('Checking TikTok API credentials...');
  
  // Check for TikTok official API credentials
  const tiktokApiKey = Deno.env.get('TIKTOK_API_KEY');
  const tiktokApiSecret = Deno.env.get('TIKTOK_API_SECRET');
  const hasOfficialCredentials = !!(tiktokApiKey && tiktokApiSecret);
  
  // Check for Apify credentials
  const apifyApiKey = Deno.env.get('APIFY_API_KEY');
  const apifySocialScraper = Deno.env.get('APIFY_SOCIALSCRAPER');
  const hasApifyCredentials = !!(apifyApiKey || apifySocialScraper);
  
  console.log(`Official TikTok API credentials present: ${hasOfficialCredentials}`);
  console.log(`Apify API credentials present: ${hasApifyCredentials}`);
  
  if (!hasOfficialCredentials && !hasApifyCredentials) {
    console.error('No TikTok API or scraper credentials are configured! Add TIKTOK_API_KEY/TIKTOK_API_SECRET or APIFY_API_KEY in Supabase secrets.');
    return false;
  }
  
  return true;
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
  
  // Validate and check credentials
  const hasCredentials = checkTikTokApiCredentials();
  
  if (!hasCredentials) {
    console.warn('Falling back to mock data due to missing credentials');
    return createMockTikTokProfile(username);
  }
  
  // Try the official TikTok API first
  console.log('ATTEMPT 1: Trying official TikTok API...');
  const officialApiResult = await fetchWithOfficialAPI(username);
  if (officialApiResult) {
    console.log(`Successfully retrieved TikTok profile from official API for: ${username}`);
    return officialApiResult;
  }
  
  console.log(`Falling back to scrapers for ${username}`);
  
  // Try TikScraper actor
  console.log('ATTEMPT 2: Trying TikScraper actor...');
  const tikScraperResult = await fetchWithTikScraper(username, apiKey);
  if (tikScraperResult) {
    console.log(`Successfully retrieved TikTok profile from TikScraper for: ${username}`);
    return tikScraperResult;
  }
  
  // Try vdrmota/tiktok-scraper actor
  console.log('ATTEMPT 3: Trying vdrmota/tiktok-scraper actor...');
  const vdrScraperResult = await fetchWithVdrMotaScraper(username, apiKey);
  if (vdrScraperResult) {
    console.log(`Successfully retrieved TikTok profile from vdrmota scraper for: ${username}`);
    return vdrScraperResult;
  }
  
  // All methods failed, return mock data
  console.log(`All TikTok API methods failed for ${username}, returning mock data`);
  return createMockTikTokProfile(username);
}
