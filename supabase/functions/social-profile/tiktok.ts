/**
 * TikTok profile fetching using only official TikTok for Business API
 * Removes all Apify dependencies and uses Meta-style approach
 */

/**
 * Calculates TikTok engagement rate
 */
export function calculateTikTokEngagementRate(stats: any) {
  if (!stats || stats.followerCount === 0 || stats.videoCount === 0) return 0;
  
  const followerCount = stats.followerCount || stats.fans || stats.follower_count || 0;
  const heartCount = stats.heartCount || stats.likes || stats.heart_count || stats.likesCount || stats.likesTotalCount || 0;
  const videoCount = stats.videoCount || stats.video_count || stats.posts || 1;
  
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
 * Attempts to fetch a TikTok profile using the official TikTok for Business API
 */
async function fetchWithOfficialAPI(username: string, accessToken?: string): Promise<any | null> {
  const tiktokAppId = Deno.env.get('TIKTOK_APP_ID');
  const tiktokApiSecret = Deno.env.get('TIKTOK_API_SECRET');
  
  if (!tiktokAppId || !tiktokApiSecret) {
    console.log('TikTok API credentials not found. Check TIKTOK_APP_ID and TIKTOK_API_SECRET env variables.');
    return null;
  }
  
  try {
    console.log(`Using TikTok for Business API for: ${username}`);
    
    if (!accessToken) {
      console.log('No TikTok access token provided - authentication required');
      return {
        username: username.replace('@', ''),
        full_name: "",
        biography: "Connect your TikTok for Business account to view detailed profile data",
        follower_count: 0,
        following_count: 0,
        post_count: 0,
        is_verified: false,
        profile_pic_url: "",
        engagement_rate: 0,
        posts: [],
        requires_auth: true,
        auth_url: `https://www.tiktok.com/auth/authorize/?client_key=${tiktokAppId}&response_type=code&scope=user.info.basic,video.list&redirect_uri=${encodeURIComponent("https://app-sandbox.acelabs.co.za/influencers")}&state=tiktok_auth`
      };
    }
    
    // Fetch user info using the provided access token
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
      throw new Error(`TikTok API error: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    console.log('TikTok API response:', JSON.stringify(userData).substring(0, 500));
    
    if (userData.data && userData.data.user) {
      console.log('Successfully retrieved user data from TikTok for Business API');
      const user = userData.data.user;
      
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
    throw new Error('Invalid response from TikTok API');
  } catch (error: any) {
    console.error(`TikTok for Business API error: ${error.message}`);
    throw error;
  }
}

/**
 * Creates mock TikTok profile data as fallback
 */
function createMockTikTokProfile(username: string) {
  console.log(`TikTok API access required for profile: ${username}`);
  
  const cleanUsername = username.replace('@', '');
  
  return {
    username: cleanUsername,
    full_name: cleanUsername,
    biography: "TikTok for Business API connection required for profile data",
    follower_count: 0,
    following_count: 0,
    post_count: 0,
    is_verified: false,
    profile_pic_url: "",
    engagement_rate: 0,
    requires_auth: true,
    is_mock_data: true
  };
}

/**
 * Main function to fetch TikTok profile using TikTok for Business API only
 */
export async function fetchTikTokProfile(username: string, accessToken?: string) {
  console.log(`Fetching TikTok profile for user: ${username}`);
  
  try {
    // Try the official TikTok for Business API
    const result = await fetchWithOfficialAPI(username, accessToken);
    if (result) {
      return result;
    }
  } catch (error) {
    console.error('TikTok API error:', error.message);
    // Fall back to requiring authentication
  }
  
  // Return mock data indicating authentication is required
  return createMockTikTokProfile(username);
}